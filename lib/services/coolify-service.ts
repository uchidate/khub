/**
 * Coolify Service — wrapper para a API do Coolify
 *
 * Expõe operações de infraestrutura para o admin do HallyuHub:
 * status de apps, deploy, rollback, env vars, scheduled tasks.
 */

const COOLIFY_BASE = process.env.COOLIFY_BASE_URL || 'http://31.97.255.107:8000/api/v1'
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN

export const APPS = {
    production: process.env.COOLIFY_PRODUCTION_UUID || 'e6h2xvvpu8i2jmzcb3tpzmxo',
    staging:    process.env.COOLIFY_STAGING_UUID    || 'lssyh30tgd0qf2ba38p2f7ex',
} as const

export type AppEnv = keyof typeof APPS

export interface CoolifyApp {
    uuid: string
    name: string
    status: string
    fqdn: string | null
    updated_at: string
}

export interface CoolifyScheduledTask {
    uuid: string
    name: string
    command: string
    frequency: string
    enabled: boolean
    timeout: number
    last_run_at?: string | null
    last_run_status?: string | null
}

export interface CoolifyEnvVar {
    uuid: string
    key: string
    is_buildtime: boolean
    is_runtime: boolean
}

class CoolifyService {
    private async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
        if (!COOLIFY_TOKEN) throw new Error('COOLIFY_TOKEN not configured')

        const res = await globalThis.fetch(`${COOLIFY_BASE}${path}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${COOLIFY_TOKEN}`,
                'Content-Type': 'application/json',
                ...(options.headers ?? {}),
            },
        })

        if (!res.ok) {
            const body = await res.text()
            throw new Error(`Coolify API error ${res.status}: ${body}`)
        }

        return res.json() as Promise<T>
    }

    // ── Apps ──────────────────────────────────────────────────────────────

    async getApp(env: AppEnv): Promise<CoolifyApp> {
        return this.fetch<CoolifyApp>(`/applications/${APPS[env]}`)
    }

    async getApps(): Promise<Record<AppEnv, CoolifyApp>> {
        const [production, staging] = await Promise.all([
            this.getApp('production'),
            this.getApp('staging'),
        ])
        return { production, staging }
    }

    // ── Deploy ────────────────────────────────────────────────────────────

    async deploy(env: AppEnv, force = false): Promise<{ deploymentUuid: string }> {
        return this.fetch<{ deploymentUuid: string }>(
            `/deploy?uuid=${APPS[env]}&force=${force}`,
        )
    }

    // ── Scheduled Tasks ───────────────────────────────────────────────────

    async getScheduledTasks(env: AppEnv): Promise<CoolifyScheduledTask[]> {
        const data = await this.fetch<CoolifyScheduledTask[]>(
            `/applications/${APPS[env]}/scheduled-tasks`,
        )
        return Array.isArray(data) ? data : []
    }

    async updateScheduledTask(env: AppEnv, taskUuid: string, patch: Partial<Pick<CoolifyScheduledTask, 'enabled' | 'frequency' | 'command'>>): Promise<CoolifyScheduledTask> {
        return this.fetch<CoolifyScheduledTask>(
            `/applications/${APPS[env]}/scheduled-tasks/${taskUuid}`,
            { method: 'PATCH', body: JSON.stringify(patch) },
        )
    }

    // ── Env Vars ──────────────────────────────────────────────────────────

    async getEnvVars(env: AppEnv): Promise<CoolifyEnvVar[]> {
        const data = await this.fetch<CoolifyEnvVar[]>(
            `/applications/${APPS[env]}/envs`,
        )
        return Array.isArray(data) ? data : []
    }

    async setEnvVar(env: AppEnv, key: string, value: string): Promise<void> {
        await this.fetch(
            `/applications/${APPS[env]}/envs`,
            { method: 'PATCH', body: JSON.stringify({ key, value }) },
        )
    }
}

let instance: CoolifyService | null = null
export function getCoolifyService(): CoolifyService {
    if (!instance) instance = new CoolifyService()
    return instance
}
