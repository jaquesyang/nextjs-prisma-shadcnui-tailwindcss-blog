'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface MarkdownEditorProps {
  initialData?: {
    title?: string
    content?: string
    excerpt?: string
    tags?: string[]
    published?: boolean
    featured?: boolean
  }
  onSave?: (data: any) => void
  onCancel?: () => void
}

export function MarkdownEditor({ initialData, onSave, onCancel }: MarkdownEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '')
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '')
  const [published, setPublished] = useState(initialData?.published || false)
  const [featured, setFeatured] = useState(initialData?.featured || false)
  const [loading, setLoading] = useState(false)

  const handleSave = async (isDraft = false) => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required')
      return
    }

    setLoading(true)

    try {
      const postData = {
        title,
        content,
        excerpt: excerpt || undefined,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
        published: isDraft ? false : published,
        featured,
      }

      if (onSave) {
        await onSave(postData)
      }
    } catch (error) {
      toast.error('Failed to save post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{initialData ? 'Edit Post' : 'Create New Post'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt (optional)</Label>
            <Input
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief description of the post"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. technology, programming, web-development"
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <div data-color-mode="light">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                height={400}
                preview="edit"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded"
              />
              <span>Published</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded"
              />
              <span>Featured</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => handleSave(true)}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              onClick={() => handleSave(false)}
              disabled={loading}
            >
              {loading ? 'Publishing...' : published ? 'Update' : 'Publish'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}