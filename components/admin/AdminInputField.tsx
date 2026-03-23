'use client'

import React, { useId } from 'react'

/**
 * AdminInputField — Campo de formulário padronizado para o admin.
 *
 * Inclui label, input/select/textarea, mensagem de erro e dica.
 *
 * Uso:
 *   <AdminInputField label="Nome" value={name} onChange={e => setName(e.target.value)} />
 *
 *   <AdminInputField
 *     label="Status"
 *     as="select"
 *     value={status}
 *     onChange={e => setStatus(e.target.value)}
 *     required
 *   >
 *     <option value="draft">Rascunho</option>
 *     <option value="published">Publicado</option>
 *   </AdminInputField>
 *
 *   <AdminInputField
 *     label="Descrição"
 *     as="textarea"
 *     rows={4}
 *     value={desc}
 *     onChange={e => setDesc(e.target.value)}
 *     hint="Máximo 500 caracteres"
 *   />
 *
 *   <AdminInputField label="Email" error="Email inválido" />
 */

// ─── Base classes compartilhadas ──────────────────────────────────────────────

export const ADMIN_INPUT_CLASS =
  'w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors'

export const ADMIN_INPUT_ERROR_CLASS =
  'w-full px-3.5 py-2.5 bg-surface border border-red-500/50 rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-red-500/70 transition-colors'

// ─── Component ────────────────────────────────────────────────────────────────

interface AdminInputFieldBaseProps {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
}

// Input text/number/email/etc
interface InputProps extends AdminInputFieldBaseProps {
  as?: 'input'
  type?: React.HTMLInputTypeAttribute
  value: string | number
  onChange: React.ChangeEventHandler<HTMLInputElement>
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  min?: string | number
  max?: string | number
  step?: string | number
  readOnly?: boolean
}

// Select
interface SelectProps extends AdminInputFieldBaseProps {
  as: 'select'
  value: string | number
  onChange: React.ChangeEventHandler<HTMLSelectElement>
  children: React.ReactNode
  disabled?: boolean
}

// Textarea
interface TextareaProps extends AdminInputFieldBaseProps {
  as: 'textarea'
  value: string
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>
  placeholder?: string
  rows?: number
  disabled?: boolean
  readOnly?: boolean
}

type AdminInputFieldProps = InputProps | SelectProps | TextareaProps

export function AdminInputField(props: AdminInputFieldProps) {
  const autoId = useId()
  const id = autoId

  const inputClass = props.error ? ADMIN_INPUT_ERROR_CLASS : ADMIN_INPUT_CLASS

  const field = (() => {
    if (props.as === 'select') {
      return (
        <select
          id={id}
          value={props.value}
          onChange={props.onChange}
          disabled={props.disabled}
          required={props.required}
          className={`${inputClass} cursor-pointer`}
        >
          {props.children}
        </select>
      )
    }

    if (props.as === 'textarea') {
      return (
        <textarea
          id={id}
          value={props.value}
          onChange={props.onChange}
          placeholder={props.placeholder}
          rows={props.rows ?? 3}
          disabled={props.disabled}
          readOnly={props.readOnly}
          required={props.required}
          className={`${inputClass} resize-none`}
        />
      )
    }

    return (
      <input
        id={id}
        type={props.type ?? 'text'}
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        disabled={props.disabled}
        autoFocus={props.autoFocus}
        min={props.min}
        max={props.max}
        step={props.step}
        readOnly={props.readOnly}
        required={props.required}
        className={inputClass}
      />
    )
  })()

  return (
    <div className={`flex flex-col gap-1.5 ${props.className ?? ''}`}>
      {props.label && (
        <label htmlFor={id} className="text-xs font-semibold text-foreground">
          {props.label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {field}
      {props.error && (
        <p className="text-xs text-red-500">{props.error}</p>
      )}
      {props.hint && !props.error && (
        <p className="text-xs text-muted">{props.hint}</p>
      )}
    </div>
  )
}
