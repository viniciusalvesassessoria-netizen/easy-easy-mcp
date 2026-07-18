export interface ToolContext { authenticatedUserId?: string; }
export interface MetricRow { ganhos_hoje: number | string; corridas: number; avaliacao: number; online_minutes: number; }
export interface LicenseRow { id: string; user_id: string; license_key: string; name: string; email: string; plan: string; expires_at: string; enabled: boolean; max_devices: number; }
export interface NotificationRow { id: string; title: string; message: string; read: boolean; created_at: string; }
