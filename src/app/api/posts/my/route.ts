import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const published = searchParams.get('published')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const posts = await prisma.post.findMany({
      where: {
        authorId: session.user.id,
        published: published === 'all' ? undefined :
                published === 'false' ? false : true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
    })

    const total = await prisma.post.count({
      where: {
        authorId: session.user.id,
        published: published === 'all' ? undefined :
                published === 'false' ? false : true,
      },
    })

    return NextResponse.json({
      posts,
      total,
      hasMore: offset ? parseInt(offset) + posts.length < total : posts.length < total,
    })
  } catch (error) {
    console.error('Error fetching user posts:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}