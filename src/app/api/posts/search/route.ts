import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    const authorId = searchParams.get('authorId')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        posts: [],
        total: 0,
        hasMore: false,
      })
    }

    // Convert query to lowercase for consistent tag matching
    const lowerQuery = query.toLowerCase()

    // Build search condition
    const searchCondition: any = {
      published: true,
      OR: [
        {
          title: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          content: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          excerpt: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          tags: {
            hasSome: [lowerQuery],
          },
        },
      ],
    }

    // Add authorId filter if provided
    const whereCondition = authorId
      ? { ...searchCondition, authorId }
      : searchCondition

    // Search posts by title, content, excerpt, and tags
    const posts = await prisma.post.findMany({
      where: whereCondition,
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
      where: whereCondition,
    })

    return NextResponse.json({
      posts,
      total,
      hasMore: offset ? parseInt(offset) + posts.length < total : posts.length < total,
    })
  } catch (error) {
    console.error('Error searching posts:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}