import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getEmailService } from '@/lib/services/email-service'
import { checkRateLimit, RateLimitPresets } from '@/lib/utils/api-rate-limiter'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, RateLimitPresets.AUTH_REGISTER)
  if (limited) return limited

  try {
    const body = await request.json()

    // Validate input
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: validatedData.email,
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: 'user',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    // Send welcome email
    try {
      const emailService = getEmailService()
      if (emailService.isEnabled()) {
        await emailService.sendWelcomeEmail(user.email, user.name || 'Usuário')
        console.log(`✅ Welcome email sent to: ${user.email}`)
      }
    } catch (emailError) {
      // Log error but don't fail registration
      console.error('⚠️  Failed to send welcome email:', emailError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Usuário criado com sucesso!',
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar usuário. Tente novamente.' },
      { status: 500 }
    )
  }
}
