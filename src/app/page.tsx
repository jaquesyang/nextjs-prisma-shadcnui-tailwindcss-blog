'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Pagination } from '@/components/ui/pagination'
import { Search } from '@/components/ui/search'
import { Highlight } from '@/components/ui/highlight'
import { formatDate } from '@/lib/utils'

interface Post {
  id: string
  title: string
  slug: string
  excerpt?: string
  tags: string[]
  featured: boolean
  published: boolean
  createdAt: string
  author: {
    name?: string
    email?: string
  }
}

interface PostsResponse {
  posts: Post[]
  total: number
  hasMore: boolean
}

export default function Home() {
  const { data: session, status } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const postsPerPage = 12

  // Calculate total pages
  const totalPages = Math.ceil(totalPosts / postsPerPage)

  useEffect(() => {
    fetchPosts()
  }, [currentPage, searchQuery])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const offset = (currentPage - 1) * postsPerPage

      // Use search endpoint if there's a search query, otherwise use regular posts endpoint
      const endpoint = searchQuery.trim()
        ? `/api/posts/search?q=${encodeURIComponent(searchQuery)}&limit=${postsPerPage}&offset=${offset}`
        : `/api/posts?published=true&limit=${postsPerPage}&offset=${offset}`

      const response = await fetch(endpoint)
      const data: PostsResponse = await response.json()
      setPosts(data.posts || [])
      setTotalPosts(data.total || 0)
    } catch (error) {
      console.error('Error fetching posts:', error)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when searching
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">NPST Blog</h1>
            {status === 'authenticated' && session ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Welcome, {session.user?.name || session.user?.email}
                </span>
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              </div>
            ) : (
              <Link href="/auth/signin">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          {searchQuery.trim() && (
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Search Results for "{searchQuery}"
            </h2>
          )}

          <div className="flex justify-between items-center mb-6">
            <Search
              onSearch={handleSearch}
              placeholder="Search posts by title, content, or tags..."
              className="w-full max-w-md"
            />
            {totalPosts > 0 && (
              <span className="text-sm text-gray-600">
                Showing {posts.length} of {totalPosts} posts
                {searchQuery.trim() && ` for "${searchQuery}"`}
              </span>
            )}
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-600">Loading...</div>
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-gray-600 text-center">
                  {searchQuery.trim()
                    ? `No posts found matching "${searchQuery}". Try different keywords.`
                    : 'No posts published yet.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <Card key={post.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          <Highlight text={post.title} highlight={searchQuery} />
                        </CardTitle>
                        {post.featured && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Featured
                          </span>
                        )}
                      </div>
                      <CardDescription>
                        By {post.author?.name || 'Anonymous'} • {formatDate(post.createdAt)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {post.excerpt && (
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          <Highlight text={post.excerpt} highlight={searchQuery} />
                        </p>
                      )}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <Link href={`/posts/${post.slug}`}>
                        <Button variant="outline" size="sm">Read More</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </main>
    </div>
  )
}