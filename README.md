# Easy&EASY MCP Server

Servidor MCP remoto, stateless e protegido por Bearer Token. Expõe as operações do Easy&EASY por Streamable HTTP e persiste dados no Supabase.

## Tools

| Tool | Operação |
| --- | --- |
| `block_chat` | Bloqueia/desbloqueia o chat |
| `get_metrics` | Retorna ganhos, corridas, avaliação e tempo online |
| `get_user_info` | Retorna usuário, plano, validade e status |
| `set_mode` | Define modo `1` (padrão) ou `2` (avançado) |
| `set_enabled` | Ativa/desativa a extensão |
| `toggle_validity_display` | Mostra/oculta o countdown |
| `get_license_info` | Retorna licença e uso de dispositivos |
| `get_notifications` | Lista as notificações recentes |

## Identidade e segurança

`Authorization: Bearer <MCP_API_TOKEN>` autentica o cliente MCP. Como um token compartilhado não identifica um usuário, envie também `X-User-Id: <uuid>` ou configure `DEFAULT_USER_ID` para uma instalação de usuário único. A tool `block_chat` aceita `user_id` explicitamente, conforme o contrato pedido.

A `SUPABASE_SERVICE_ROLE_KEY` fica somente no servidor. Nunca a inclua na extensão, no Cursor ou em outro cliente. A comparação do token é feita em tempo constante e todas as rotas `/mcp` são protegidas. `/health` é público e não retorna segredos.

## Instalação local

Requer Node.js 20 ou superior.

```bash
npm install
cp .env.example .env
npm run build
npm start
```

O servidor carrega `.env` automaticamente com `dotenv`. Também é possível sobrescrever as variáveis pelo ambiente do processo. Exemplo no PowerShell:

```powershell
$env:MCP_API_TOKEN = 'um-token-longo-e-aleatorio'
$env:SUPABASE_URL = 'https://seu-projeto.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY = 'sua-service-role-key'
$env:DEFAULT_USER_ID = 'uuid-do-usuario'
npm start
```

Prepare o banco executando [schema.sql](./schema.sql) no SQL Editor do Supabase. O arquivo cria `licenses`, `activations`, `user_preferences`, `metrics` e `notifications`, habilita RLS e concede à `service_role` somente os privilégios usados pela Data API. Isso é necessário em projetos novos que não expõem tabelas automaticamente.

## Testes HTTP

Health check:

```bash
curl http://localhost:3000/health
```

O MCP usa JSON-RPC 2.0. Primeiro inicialize o protocolo:

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer seu-token" \
  -H "X-User-Id: uuid-do-usuario" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"curl","version":"1.0.0"}}}'
```

Como o transporte é stateless, uma chamada `tools/list` pode ser enviada em outra requisição após o cliente negociar a versão suportada:

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer seu-token" \
  -H "X-User-Id: uuid-do-usuario" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

## Deploy no Render

O [render.yaml](./render.yaml) contém o Blueprint. No Render:

1. Publique este repositório no GitHub/GitLab e crie um Blueprint a partir dele, ou crie um Web Service Node manualmente.
2. Use `npm ci && npm run build` como Build Command e `npm start` como Start Command.
3. Configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
4. O Blueprint gera `MCP_API_TOKEN`. Em configuração manual, crie essa variável como um segredo aleatório; o Render não a cria automaticamente fora do Blueprint.
5. Opcionalmente configure `DEFAULT_USER_ID`.
6. Confirme `https://seu-servico.onrender.com/health` e use `https://seu-servico.onrender.com/mcp` no cliente.

O plano gratuito pode suspender o serviço por inatividade; isso aumenta a latência da primeira chamada.

### Publicação automatizada

Em Git Bash, execute `./deploy.sh`. O script verifica a autenticação do GitHub, impede publicação acidental do `.env`, cria um repositório privado quando não há remoto e envia a branch `main`. Para verificar um serviço Render já criado, defina `RENDER_URL` e `MCP_TOKEN` no ambiente antes de executá-lo.

Para um serviço novo, use o fluxo de Blueprint no Dashboard. A CLI oficial atual usa `render services create` para criação e `render deploys create <SERVICE_ID>` para disparar deploys; o comando antigo `render deploy --service` não é válido.

## Cursor / clientes HTTP MCP

```json
{
  "mcpServers": {
    "easy-easy": {
      "url": "https://easy-easy-mcp.onrender.com/mcp",
      "headers": {
        "Authorization": "Bearer SEU_TOKEN",
        "X-User-Id": "UUID_DO_USUARIO"
      }
    }
  }
}
```

## Claude Desktop

Claude Desktop normalmente inicia servidores locais por `stdio`; uma URL HTTP remota requer um conector/bridge que suporte Streamable HTTP. Quando a versão instalada aceitar servidores MCP remotos, use a mesma URL e os mesmos headers do exemplo acima. Não use `npx @modelcontextprotocol/sdk connect`: o SDK oficial é uma biblioteca e não fornece esse comando genérico.

## Extensão

Crie um novo módulo `tool-nome.ts`, implemente um handler assíncrono que retorna `CallToolResult` e registre-o em `mcp-server.ts`. Cada requisição cria servidor e transporte novos; nenhum estado de usuário é mantido em memória.

> Nota de estrutura: este checkout OneDrive recusou a criação de subdiretórios pelo sistema operacional. Por isso os módulos estão na raiz, com prefixos claros. Em um checkout normal, eles podem ser movidos sem mudança de lógica para `src/tools`, `src/auth`, `src/supabase` e `src/types`, ajustando os imports e `rootDir`.
