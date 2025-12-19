import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const published = searchParams.get('published')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const posts = await prisma.post.findMany({
      where: {
        published: published === 'all' ? undefined : published === 'false' ? false : true,
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
        published: published === 'all' ? undefined : published === 'false' ? false : true,
      },
    })

    return NextResponse.json({
      posts,
      total,
      hasMore: offset ? parseInt(offset) + posts.length < total : posts.length < total,
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { title, content, excerpt, published, featured, tags, coverImage } = await request.json()

    // Convert tags to lowercase for consistent storage
    const normalizedTags = tags ? tags.map((tag: string) => tag.toLowerCase()) : []

    if (!title || !content) {
      return NextResponse.json(
        { message: 'Title and content are required' },
        { status: 400 }
      )
    }

    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists and add unique identifier if needed
    let uniqueSlug = slug
    let counter = 1

    while (true) {
      const existingPost = await prisma.post.findUnique({
        where: { slug: uniqueSlug },
      })

      if (!existingPost) {
        slug = uniqueSlug
        break
      }

      uniqueSlug = `${slug}-${counter}`
      counter++
    }

    const readTime = Math.ceil(content.split(' ').length / 200)

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        published: published || false,
        featured: featured || false,
        tags: normalizedTags,
        readTime,
        coverImage,
        publishedAt: published ? new Date() : null,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}