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
import { isAdmin } from '@/lib/permissions'
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

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [settings, setSettings] = useState<Settings>({} as Settings)
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'settings'>('users')
  const [loading, setLoading] = useState(true)

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
  }, [status, session, activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'users') {
        const response = await fetch('/api/admin/users')
        const data = await response.json()
        setUsers(data.users || [])
      } else if (activeTab === 'posts') {
        const response = await fetch('/api/posts?published=all')
        const data = await response.json()
        setPosts(data.posts || [])
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
        fetchData()
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
              onClick={() => setActiveTab('users')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('settings')}
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
              <CardTitle>All Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{post.title}</h3>
                      <p className="text-sm text-gray-600">
                        By {post.author.name} • {new Date(post.createdAt).toLocaleDateString()}
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
                <Button
                  variant="outline"
                  onClick={toggleRegistration}
                >
                  {settings.ALLOW_REGISTRATION === 'true' ? 'Disable' : 'Enable'}
                </Button>
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