import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
})

export async function POST(request: NextRequest) {
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

    // TODO: Send email with reset link
    // For now, we'll just log it (in production, use a service like SendGrid, Resend, etc.)
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password?token=${resetToken}`

    if (process.env.NODE_ENV === 'development') {
      console.log('🔗 Reset password URL:', resetUrl)
    }

    // In production, send email here:
    // await sendPasswordResetEmail(user.email, resetUrl)

    return NextResponse.json({
      success: true,
      message: 'Se o email existir, você receberá um link de recuperação.',
      ...(process.env.NODE_ENV === 'development' && { resetUrl }), // Only in dev
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação. Tente novamente.' },
      { status: 500 }
    )
  }
}
