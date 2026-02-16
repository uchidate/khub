import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getEmailService } from '@/lib/services/email-service'
import { checkRateLimit, RateLimitPresets } from '@/lib/utils/api-rate-limiter'
import { createLogger } from '@/lib/utils/logger'
import { getErrorMessage } from '@/lib/utils/error'

const log = createLogger('AUTH')

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, RateLimitPresets.AUTH_FORGOT_PASSWORD)
  if (limited) return limited

  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Se o email existir, você receberá um link de recuperação.',
      })
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // 1 hour

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email },
    })

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        email,
        token: resetToken,
        expires,
      },
    })

    // Send password reset email
    try {
      const emailService = getEmailService()

      if (emailService.isEnabled()) {
        await emailService.sendPasswordResetEmail(
          user.email,
          resetToken,
          user.name || undefined
        )
        log.info('Password reset email sent', { email: user.email })
      } else {
        log.warn('Email service disabled, reset link not sent')

        // In development, log the reset URL
        if (process.env.NODE_ENV === 'development') {
          const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=${resetToken}`
          log.debug('Reset password URL', { url: resetUrl })
        }
      }
    } catch (emailError) {
      log.error('Failed to send password reset email', { error: getErrorMessage(emailError) })

      // In development, still log the URL even if email fails
      if (process.env.NODE_ENV === 'development') {
        const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=${resetToken}`
        log.debug('Reset password URL (email failed)', { url: resetUrl })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Se o email existir, você receberá um link de recuperação.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    log.error('Forgot password error', { error: getErrorMessage(error) })
    return NextResponse.json(
      { error: 'Erro ao processar solicitação. Tente novamente.' },
      { status: 500 }
    )
  }
}
