import { useState, useCallback } from 'react'

type ValidationRule<T> = {
  validate: (value: T) => boolean
  message: string
}

type FieldValidations<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[]
}

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validations?: FieldValidations<T>
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const validateField = useCallback(
    (name: keyof T, value: any): string | undefined => {
      const fieldValidations = validations?.[name]
      if (!fieldValidations) return undefined

      for (const rule of fieldValidations) {
        if (!rule.validate(value)) {
          return rule.message
        }
      }
      return undefined
    },
    [validations]
  )

  const handleChange = useCallback(
    (name: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }))

      // Validate on change if field was already touched
      if (touched[name]) {
        const error = validateField(name, value)
        setErrors((prev) => ({
          ...prev,
          [name]: error,
        }))
      }
    },
    [touched, validateField]
  )

  const handleBlur = useCallback(
    (name: keyof T) => {
      setTouched((prev) => ({ ...prev, [name]: true }))

      // Validate on blur
      const error = validateField(name, values[name])
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }))
    },
    [values, validateField]
  )

  const validateAll = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    let isValid = true

    Object.keys(values).forEach((key) => {
      const name = key as keyof T
      const error = validateField(name, values[name])
      if (error) {
        newErrors[name] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    setTouched(
      Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    )

    return isValid
  }, [values, validateField])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setValues,
    setErrors,
  }
}

// Common validation rules
export const ValidationRules = {
  required: (message = 'Este campo é obrigatório') => ({
    validate: (value: any) => {
      if (typeof value === 'string') return value.trim().length > 0
      return value != null && value !== ''
    },
    message,
  }),

  email: (message = 'Email inválido') => ({
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    },
    message,
  }),

  minLength: (length: number, message?: string) => ({
    validate: (value: string) => value.length >= length,
    message: message || `Mínimo de ${length} caracteres`,
  }),

  maxLength: (length: number, message?: string) => ({
    validate: (value: string) => value.length <= length,
    message: message || `Máximo de ${length} caracteres`,
  }),

  pattern: (regex: RegExp, message: string) => ({
    validate: (value: string) => regex.test(value),
    message,
  }),

  custom: <T,>(validate: (value: T) => boolean, message: string) => ({
    validate,
    message,
  }),
}
