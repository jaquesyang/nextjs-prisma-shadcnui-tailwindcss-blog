'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { isAdmin } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { Search } from '@/components/ui/search'
import { Highlight } from '@/components/ui/highlight'
import '@/types/auth'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  _count: {
    posts: number
  }
}

interface Post {
  id: string
  title: string
  slug: string
  published: boolean
  featured: boolean
  createdAt: string
  author: {
    name: string
    email: string
  }
}

interface Settings {
  ALLOW_REGISTRATION: string
}

interface PostsResponse {
  posts: Post[]
  total: number
  hasMore: boolean
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [settings, setSettings] = useState<Settings>({} as Settings)
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'settings'>('users')
  const [loading, setLoading] = useState(true)

  // Pagination states for posts
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const postsPerPage = 10

  // Calculate total pages
  const totalPages = Math.ceil(totalPosts / postsPerPage)

  // Handle tab change and reset pagination
  const handleTabChange = (tab: 'users' | 'posts' | 'settings') => {
    setActiveTab(tab)
    if (tab === 'posts') {
      setCurrentPage(1) // Reset to first page when switching to posts
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when searching
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && !isAdmin(session?.user?.role as any)) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    if (status === 'authenticated' && isAdmin(session?.user?.role as any)) {
      fetchData()
    }
  }, [status, session, activeTab, currentPage, searchQuery])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'users') {
        const response = await fetch('/api/admin/users')
        const data = await response.json()
        setUsers(data.users || [])
      } else if (activeTab === 'posts') {
        const offset = (currentPage - 1) * postsPerPage
        // Use search endpoint if there's a search query, otherwise use regular posts endpoint
        const endpoint = searchQuery.trim()
          ? `/api/posts/search?q=${encodeURIComponent(searchQuery)}&limit=${postsPerPage}&offset=${offset}`
          : `/api/posts?published=all&limit=${postsPerPage}&offset=${offset}`
        const response = await fetch(endpoint)
        const data: PostsResponse = await response.json()
        setPosts(data.posts || [])
        setTotalPosts(data.total || 0)
      } else if (activeTab === 'settings') {
        const response = await fetch('/api/settings')
        const data = await response.json()
        const settingsObj = data.reduce((acc: any, setting: any) => {
          acc[setting.key] = setting.value
          return acc
        }, {})
        setSettings(settingsObj)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const toggleRegistration = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'ALLOW_REGISTRATION',
          value: settings.ALLOW_REGISTRATION === 'true' ? 'false' : 'true',
          description: 'Allow new user registrations'
        }),
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error updating settings:', error)
    }
  }

  const deletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // If we're on the last page and it becomes empty after deletion, go to previous page
        if (posts.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
        } else {
          fetchData()
        }
      } else {
        const error = await response.json()
        console.error('Failed to delete post:', error.message)
        // You could add a toast notification here
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      // You could add a toast notification here
    }
  }

  const togglePostPublish = async (postId: string, published: boolean) => {
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ published: !published }),
      })

      if (response.ok) {
        fetchData()
      } else {
        const error = await response.json()
        console.error('Failed to update post:', error.message)
        // You could add a toast notification here
      }
    } catch (error) {
      console.error('Error updating post:', error)
      // You could add a toast notification here
    }
  }

  if (status === 'loading' || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!session || !isAdmin(session.user.role as any)) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <span className="text-sm text-gray-600">
                Admin: {session.user?.name || session.user?.email}
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">Sign Out</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign out</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to sign out of your account?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => signOut({ callbackUrl: '/' })}>
                      Sign Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex space-x-1 border-b">
            <button
              onClick={() => handleTabChange('users')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => handleTabChange('posts')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => handleTabChange('settings')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Settings
            </button>
          </div>
        </div>

        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posts
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user._count.posts}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={user.isActive ? 'default' : 'destructive'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserStatus(user.id, user.isActive)}
                            disabled={user.id === session.user?.id}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'posts' && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Posts</CardTitle>
              </div>
              <div className="flex justify-between items-center mt-4">
                <Search
                  onSearch={handleSearch}
                  placeholder="Search all posts..."
                  className="w-full max-w-md"
                />
                {totalPosts > 0 && (
                  <span className="text-sm text-gray-600">
                    Showing {posts.length} of {totalPosts} posts
                    {searchQuery.trim() && ` for "${searchQuery}"`}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        <Highlight text={post.title} highlight={searchQuery} />
                      </h3>
                      <p className="text-sm text-gray-600">
                        By {post.author.name} • {formatDate(post.createdAt)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={post.published ? 'default' : 'secondary'}>
                          {post.published ? 'Published' : 'Draft'}
                        </Badge>
                        {post.featured && (
                          <Badge variant="outline">Featured</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link href={`/posts/${post.slug}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            {post.published ? 'Unpublish' : 'Publish'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {post.published ? 'Unpublish post' : 'Publish post'}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to {post.published ? 'unpublish' : 'publish'} "{post.title}"?
                              {post.published ? ' It will no longer be visible to the public.' : ' It will be visible to the public.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => togglePostPublish(post.id, post.published)}>
                              {post.published ? 'Unpublish' : 'Publish'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete post</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{post.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deletePost(post.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center space-x-1"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      <span>Previous</span>
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="min-w-8"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center space-x-1"
                    >
                      <span>Next</span>
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Allow Registration</h3>
                  <p className="text-sm text-gray-600">
                    Enable or disable new user registration
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">
                      {settings.ALLOW_REGISTRATION === 'true' ? 'Disable' : 'Enable'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {settings.ALLOW_REGISTRATION === 'true' ? 'Disable Registration' : 'Enable Registration'}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {settings.ALLOW_REGISTRATION === 'true'
                          ? 'Are you sure you want to disable new user registration? This will prevent new users from creating accounts on your blog.'
                          : 'Are you sure you want to enable new user registration? This will allow anyone to create an account on your blog.'
                        }
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={toggleRegistration}>
                        {settings.ALLOW_REGISTRATION === 'true' ? 'Disable' : 'Enable'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  Current status: <strong>{settings.ALLOW_REGISTRATION === 'true' ? 'Enabled' : 'Disabled'}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}