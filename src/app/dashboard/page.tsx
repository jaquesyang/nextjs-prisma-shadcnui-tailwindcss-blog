'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isAdmin } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarkdownEditor } from '@/components/editor/MarkdownEditor'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pagination } from '@/components/ui/pagination'
import { Search } from '@/components/ui/search'
import { Highlight } from '@/components/ui/highlight'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import '@/types/auth'

interface Post {
  id: string
  title: string
  slug: string
  published: boolean
  featured: boolean
  createdAt: string
  updatedAt: string
}

interface PostsResponse {
  posts: Post[]
  total: number
  hasMore: boolean
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [showEditor, setShowEditor] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const postsPerPage = 10

  // Calculate total pages
  const totalPages = Math.ceil(totalPosts / postsPerPage)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchPosts()
    }
  }, [status, currentPage, searchQuery])

  const fetchPosts = async () => {
    try {
      const offset = (currentPage - 1) * postsPerPage

      // Use search endpoint if there's a search query, otherwise use regular posts endpoint
      const endpoint = searchQuery.trim()
        ? `/api/posts/search?q=${encodeURIComponent(searchQuery)}&authorId=${session?.user?.id}&limit=${postsPerPage}&offset=${offset}`
        : `/api/posts/my?published=all&limit=${postsPerPage}&offset=${offset}`

      const response = await fetch(endpoint)
      const data: PostsResponse = await response.json()
      setPosts(data.posts || [])
      setTotalPosts(data.total || 0)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleSavePost = async (postData: any) => {
    try {
      const url = editingPost ? `/api/posts/${editingPost.slug}` : '/api/posts'
      const method = editingPost ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        throw new Error('Failed to save post')
      }

      setShowEditor(false)
      setEditingPost(null)
      fetchPosts()
    } catch (error) {
      console.error('Error saving post:', error)
    }
  }

  const handleEdit = (post: Post) => {
    setEditingPost(post)
    setShowEditor(true)
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      fetchPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long')
      return
    }

    setChangingPassword(true)
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password')
      }

      toast.success('Password changed successfully')
      setShowChangePassword(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  if (status === 'loading' || loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (!session) {
    return null
  }

  if (showEditor) {
    return (
      <MarkdownEditor
        initialData={editingPost || {}}
        onSave={handleSavePost}
        onCancel={() => {
          setShowEditor(false)
          setEditingPost(null)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {session.user?.name || session.user?.email}
              </span>
              {isAdmin(session.user?.role as any) && (
                <Link href="/admin">
                  <Button variant="outline">Admin Panel</Button>
                </Link>
              )}
              <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
                <DialogTrigger asChild>
                  <Button variant="outline">Change Password</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and a new password to change your password.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 6 characters)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowChangePassword(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                    >
                      {changingPassword ? 'Changing...' : 'Change Password'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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

      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Your Posts</CardTitle>
              <Button onClick={() => setShowEditor(true)}>
                New Post
              </Button>
            </div>
            <div className="flex justify-between items-center mt-4">
              <Search
                onSearch={handleSearch}
                placeholder="Search your posts..."
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
            {posts.length === 0 && totalPosts === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">You haven't created any posts yet.</p>
                <Button onClick={() => setShowEditor(true)}>
                  Create Your First Post
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          <Highlight text={post.title} highlight={searchQuery} />
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className={`px-2 py-1 text-xs rounded ${
                            post.published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {post.published ? 'Published' : 'Draft'}
                          </span>
                          {post.featured && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              Featured
                            </span>
                          )}
                          <span className="text-sm text-gray-500">
                            Last updated: {formatDate(post.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link href={`/posts/${post.slug}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(post)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
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
          </CardContent>
        </Card>
      </main>
    </div>
  )
}