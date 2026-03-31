/**
 * Base types and utilities shared by all repositories.
 *
 * Pattern:
 *   - RepositoryError carries HTTP status so route handlers stay thin
 *   - toHttpError maps unknown errors to safe JSON responses
 *   - ListParams / ListResult are the standard pagination contract
 */

import { z } from 'zod'
import { NextResponse } from 'next/server'

// ── Error ─────────────────────────────────────────────────────────────────────

export type ErrorCode =
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'VALIDATION'
    | 'CONSTRAINT'
    | 'UNAUTHORIZED'
    | 'INTERNAL'

export class RepositoryError extends Error {
    constructor(
        message: string,
        public readonly code: ErrorCode,
        public readonly status: number,
        public readonly details?: unknown
    ) {
        super(message)
        this.name = 'RepositoryError'
    }
}

/**
 * Convert any caught error into a NextResponse.
 * Use at the route handler boundary so repositories stay framework-agnostic.
 */
export function toHttpError(error: unknown): NextResponse {
    if (error instanceof RepositoryError) {
        return NextResponse.json(
            { error: error.message, ...(error.details ? { details: error.details } : {}) },
            { status: error.status }
        )
    }
    if (error instanceof z.ZodError) {
        return NextResponse.json(
            { error: 'Dados inválidos', details: error.issues },
            { status: 400 }
        )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface ListParams {
    page?: number
    limit?: number
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
}

export interface ListResult<T> {
    data: T[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export function paginate(page = 1, limit = 20) {
    const p = Math.max(1, page)
    const l = Math.min(100, Math.max(1, limit))
    return { skip: (p - 1) * l, take: l, page: p, limit: l }
}

export function listResult<T>(data: T[], total: number, page: number, limit: number): ListResult<T> {
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}

// ── Context passed to write operations ───────────────────────────────────────

export interface WriteContext {
    /** ID do admin/usuário que está fazendo a alteração */
    adminId: string
    /** IP extraído de x-forwarded-for (best-effort) */
    ip?: string
}
