'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { updatePost } from '@/app/actions/post'
import TipTapEditor from '@/components/editor/TipTapEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { Category, Post } from '@/lib/types'

export default function EditPostPage() {
  const params = useParams<{ id: string }>()
  const postId = parseInt(params.id)
  const [post, setPost] = useState<Post | null>(null)
  const [content, setContent] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('posts').select('*').eq('id', postId).single(),
      supabase.from('categories').select('*').order('id'),
    ]).then(([{ data: postData }, { data: catData }]) => {
      if (postData) { setPost(postData as Post); setContent(postData.content) }
      if (catData) setCategories(catData)
    })
  }, [postId])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.set('content', content)
    const result = await updatePost(postId, formData)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  if (!post) {
    return <div className="text-center py-16 text-muted-foreground">불러오는 중...</div>
  }

  return (
    <div className="bg-white border rounded-lg p-6 space-y-4">
      <h1 className="text-xl font-bold">글 수정</h1>
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>게시판</Label>
          <Select name="category_id" defaultValue={String(post.category_id)} required>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input id="title" name="title" defaultValue={post.title} required />
        </div>
        <div className="space-y-2">
          <Label>내용</Label>
          <TipTapEditor content={post.content} onChange={setContent} />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => history.back()}>취소</Button>
          <Button type="submit" disabled={loading}>{loading ? '저장 중...' : '수정 완료'}</Button>
        </div>
      </form>
    </div>
  )
}
