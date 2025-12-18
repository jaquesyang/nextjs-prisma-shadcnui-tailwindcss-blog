import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'ALLOW_REGISTRATION' }
    })

    const allowRegistration = setting?.value === 'true'

    return NextResponse.json({ allowRegistration })
  } catch (error) {
    console.error('Error fetching registration settings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}