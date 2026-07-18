#!/usr/bin/env bash
set -euo pipefail

# Publica o repositorio e, opcionalmente, verifica um servico Render existente.
# Uso:
#   ./deploy.sh [nome-do-repositorio]
#   RENDER_URL=https://servico.onrender.com MCP_TOKEN=... ./deploy.sh

REPO_NAME="${1:-easy-easy-mcp}"

command -v git >/dev/null || { echo "git nao encontrado" >&2; exit 1; }
command -v gh >/dev/null || { echo "GitHub CLI (gh) nao encontrado" >&2; exit 1; }
gh auth status >/dev/null

if ! git check-ignore -q .env; then
  echo "ERRO: .env nao esta protegido pelo .gitignore" >&2
  exit 1
fi

PROJECT_FILES=(
  .env.example .gitignore README.md auth-middleware.ts deploy.sh index.ts
  mcp-server.ts package-lock.json package.json render.yaml schema.sql
  supabase-client.ts tool-block-chat.ts tool-get-license.ts
  tool-get-metrics.ts tool-get-notifications.ts tool-get-user-info.ts
  tool-set-enabled.ts tool-set-mode.ts tool-shared.ts
  tool-toggle-validity.ts tsconfig.json types.ts
)

git add -- "${PROJECT_FILES[@]}"
if ! git diff --cached --quiet; then
  git commit -m "feat: servidor MCP Easy&EASY"
fi

git branch -M main
if ! git remote get-url origin >/dev/null 2>&1; then
  gh repo create "$REPO_NAME" --private --source=. --remote=origin
fi
git push -u origin main

REPO_URL="$(gh repo view --json url --jq .url)"
echo "Repositorio publicado: $REPO_URL"
echo "Crie um Blueprint em: https://dashboard.render.com/blueprints"
echo "O Render pedira SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e DEFAULT_USER_ID."
echo "MCP_API_TOKEN sera gerado pelo render.yaml."

if [[ -n "${RENDER_URL:-}" ]]; then
  BASE_URL="${RENDER_URL%/}"
  echo "Verificando $BASE_URL..."
  curl --fail --silent --show-error "$BASE_URL/health"
  echo

  AUTH_STATUS="$(curl --silent --output /dev/null --write-out '%{http_code}' \
    --request POST "$BASE_URL/mcp" \
    --header 'Content-Type: application/json' \
    --data '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}')"
  [[ "$AUTH_STATUS" == "401" ]] || { echo "Auth esperava 401, recebeu $AUTH_STATUS" >&2; exit 1; }

  if [[ -n "${MCP_TOKEN:-}" ]]; then
    TOOLS_RESPONSE="$(curl --fail --silent --show-error \
      --request POST "$BASE_URL/mcp" \
      --header "Authorization: Bearer $MCP_TOKEN" \
      --header 'Content-Type: application/json' \
      --header 'Accept: application/json, text/event-stream' \
      --data '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}')"
    [[ "$TOOLS_RESPONSE" == *'get_metrics'* ]] || { echo "Lista de tools invalida" >&2; exit 1; }
    echo "Health, autenticacao e tools: OK"
  fi
fi
