import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { formatDate } from '@/lib/utils'

async function getPost(slug: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
      || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/posts/${slug}`, {
      cache: 'no-store',
    })

    if (!res.ok) {
      return null
    }

    return res.json()
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <article className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-block mb-8">
          <Button variant="outline">← Back to Home</Button>
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                {post.author?.avatar && (
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {post.author?.name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(post.publishedAt || post.createdAt)}
                  </p>
                </div>
              </div>
              {post.readTime && (
                <span className="text-sm text-gray-500">
                  {post.readTime} min read
                </span>
              )}
            </div>

            <CardTitle className="text-3xl mb-4">{post.title}</CardTitle>

            {post.excerpt && (
              <p className="text-lg text-gray-600 mb-4">{post.excerpt}</p>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </CardHeader>

          <CardContent>
            {post.coverImage && (
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-64 object-cover rounded-lg mb-8"
              />
            )}

            <div className="prose prose-lg max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {post.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <Link href="/">
            <Button>← Back to All Posts</Button>
          </Link>
        </div>
      </article>
    </div>
  )
}