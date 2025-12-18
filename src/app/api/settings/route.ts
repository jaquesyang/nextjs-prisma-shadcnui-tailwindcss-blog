import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !isAdmin(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key) {
      const setting = await prisma.settings.findUnique({
        where: { key }
      })
      return NextResponse.json(setting)
    } else {
      const settings = await prisma.settings.findMany()
      return NextResponse.json(settings)
    }
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !isAdmin(session.user.role as any)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { key, value, description } = await request.json()

    if (!key || value === undefined) {
      return NextResponse.json(
        { message: 'Key and value are required' },
        { status: 400 }
      )
    }

    const setting = await prisma.settings.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description }
    })

    return NextResponse.json(setting, { status: 201 })
  } catch (error) {
    console.error('Error saving setting:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}