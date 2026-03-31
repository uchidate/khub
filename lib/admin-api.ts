/**
 * admin-api.ts
 *
 * Camada cliente tipada sobre as rotas /api/admin/*.
 * Elimina o boilerplate de fetch + JSON + if(!res.ok) em 76+ lugares.
 *
 * Uso:
 *   import { adminApi, ApiError } from '@/lib/admin-api'
 *
 *   try {
 *     const group = await adminApi.groups.update(id, data)
 *   } catch (err) {
 *     toast.error(err instanceof ApiError ? err.message : 'Erro inesperado')
 *   }
 */

// ── Base ──────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
    constructor(message: string, public readonly status: number) {
        super(message)
        this.name = 'ApiError'
    }
}

async function apiFetch<T = unknown>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options?.headers },
    })

    if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new ApiError(body?.error ?? `Erro ${res.status}`, res.status)
    }

    return res.json() as Promise<T>
}

function post<T = unknown>(url: string, body: unknown): Promise<T> {
    return apiFetch<T>(url, { method: 'POST', body: JSON.stringify(body) })
}

function patch<T = unknown>(url: string, body: unknown): Promise<T> {
    return apiFetch<T>(url, { method: 'PATCH', body: JSON.stringify(body) })
}

function del<T = unknown>(url: string, body?: unknown): Promise<T> {
    return apiFetch<T>(url, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function qs(params?: object | null): string {
    if (!params) return ''
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
        if (v != null) p.set(k, String(v))
    }
    const s = p.toString()
    return s ? `?${s}` : ''
}

// ── Pagination types ──────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
    data: T[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
}

export interface ListParams {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    filter?: string
}

// ── Admin API client ──────────────────────────────────────────────────────────

export const adminApi = {

    // ── Groups ────────────────────────────────────────────────────────────────

    groups: {
        list: (p?: ListParams & { status?: string }) =>
            apiFetch<PaginatedResponse<Record<string, unknown>>>(`/api/admin/groups${qs(p)}`),
        get: (id: string) =>
            apiFetch<Record<string, unknown>>(`/api/admin/groups${qs({ id })}`),
        stats: () =>
            apiFetch<Record<string, number>>('/api/admin/groups?stats=1'),
        all: () =>
            apiFetch<{ data: { id: string; name: string }[] }>('/api/admin/groups/all'),
        create: (data: Record<string, unknown>) =>
            post<Record<string, unknown>>('/api/admin/groups', data),
        update: (id: string, data: Record<string, unknown>) =>
            patch<Record<string, unknown>>(`/api/admin/groups${qs({ id })}`, data),
        delete: (ids: string[]) =>
            del<{ message: string }>('/api/admin/groups', { ids }),
        members: {
            list: (groupId: string) =>
                apiFetch<{ members: Record<string, unknown>[] }>(`/api/admin/groups/${groupId}/members`),
            add: (groupId: string, data: Record<string, unknown>) =>
                post<{ membership: Record<string, unknown> }>(`/api/admin/groups/${groupId}/members`, data),
            update: (groupId: string, data: Record<string, unknown>) =>
                patch<{ membership: Record<string, unknown> }>(`/api/admin/groups/${groupId}/members`, data),
            remove: (groupId: string, artistId: string) =>
                del(`/api/admin/groups/${groupId}/members${qs({ artistId })}`),
        },
    },

    // ── Artists ───────────────────────────────────────────────────────────────

    artists: {
        list: (p?: ListParams & { filter?: string }) =>
            apiFetch<PaginatedResponse<Record<string, unknown>>>(`/api/admin/artists${qs(p)}`),
        get: (id: string) =>
            apiFetch<Record<string, unknown>>(`/api/admin/artists${qs({ id })}`),
        stats: () =>
            apiFetch<Record<string, number>>('/api/admin/artists/stats'),
        create: (data: Record<string, unknown>) =>
            post<Record<string, unknown>>('/api/admin/artists', data),
        update: (id: string, data: Record<string, unknown>) =>
            patch<Record<string, unknown>>(`/api/admin/artists${qs({ id })}`, data),
        bulkHide: (ids: string[], hide: boolean) =>
            patch<Record<string, unknown>>(`/api/admin/artists${qs({ bulk: hide ? 'hide' : 'show' })}`, { ids }),
        delete: (ids: string[]) =>
            del<{ message: string }>('/api/admin/artists', { ids }),
        flag: (artistId: string, flaggedAsNonKorean: boolean) =>
            apiFetch('/api/admin/artists/moderation', {
                method: 'PUT',
                body: JSON.stringify({ artistId, flaggedAsNonKorean }),
            }),
    },

    // ── Productions ───────────────────────────────────────────────────────────

    productions: {
        list: (p?: ListParams & { filter?: string }) =>
            apiFetch<PaginatedResponse<Record<string, unknown>>>(`/api/admin/productions${qs(p)}`),
        get: (id: string) =>
            apiFetch<Record<string, unknown>>(`/api/admin/productions${qs({ id })}`),
        stats: () =>
            apiFetch<Record<string, number>>('/api/admin/productions/stats'),
        create: (data: Record<string, unknown>) =>
            post<Record<string, unknown>>('/api/admin/productions', data),
        update: (id: string, data: Record<string, unknown>) =>
            patch<Record<string, unknown>>(`/api/admin/productions${qs({ id })}`, data),
        delete: (ids: string[]) =>
            del<{ message: string }>('/api/admin/productions', { ids }),
    },

    // ── Agencies ──────────────────────────────────────────────────────────────

    agencies: {
        list: (p?: ListParams & { type?: string; verifiedOnly?: boolean }) =>
            apiFetch<PaginatedResponse<Record<string, unknown>>>(`/api/admin/agencies${qs(p)}`),
        get: (id: string) =>
            apiFetch<Record<string, unknown>>(`/api/admin/agencies${qs({ id })}`),
        all: () =>
            apiFetch<{ data: { id: string; name: string; type: string }[] }>('/api/admin/agencies/all'),
        create: (data: Record<string, unknown>) =>
            post<Record<string, unknown>>('/api/admin/agencies', data),
        update: (id: string, data: Record<string, unknown>) =>
            patch<Record<string, unknown>>(`/api/admin/agencies${qs({ id })}`, data),
        delete: (ids: string[]) =>
            del<{ message: string }>('/api/admin/agencies', { ids }),
    },

    // ── Albums ────────────────────────────────────────────────────────────────

    albums: {
        list: (p?: ListParams & { artistId?: string }) =>
            apiFetch<PaginatedResponse<Record<string, unknown>>>(`/api/admin/albums${qs(p)}`),
        create: (data: Record<string, unknown>) =>
            post<Record<string, unknown>>('/api/admin/albums', data),
        update: (id: string, data: Record<string, unknown>) =>
            patch<Record<string, unknown>>(`/api/admin/albums${qs({ id })}`, data),
        delete: (ids: string[]) =>
            del<{ message: string }>('/api/admin/albums', { ids }),
    },

    // ── Users ─────────────────────────────────────────────────────────────────

    users: {
        list: (p?: ListParams & { role?: string }) =>
            apiFetch<PaginatedResponse<Record<string, unknown>>>(`/api/admin/users${qs(p)}`),
        stats: () =>
            apiFetch<Record<string, number>>('/api/admin/users?stats=1'),
        create: (data: Record<string, unknown>) =>
            post<Record<string, unknown>>('/api/admin/users', data),
        update: (id: string, data: Record<string, unknown>) =>
            patch<Record<string, unknown>>(`/api/admin/users${qs({ id })}`, data),
        delete: (ids: string[]) =>
            del<{ message: string }>('/api/admin/users', { ids }),
    },
}
