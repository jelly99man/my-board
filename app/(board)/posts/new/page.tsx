'use client'

import { useState, useEffect } from 'react'
import { createPost } from '@/app/actions/post'
import TipTapEditor from '@/components/editor/TipTapEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/lib/types'

export default function NewPostPage() {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    createClient().from('categories').select('*').order('id').then(({ data }) => {
      if (data) setCategories(data)
    })
  }, [])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.set('content', content)
    const result = await createPost(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border rounded-lg p-6 space-y-4">
      <h1 className="text-xl font-bold">글 쓰기</h1>
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>게시판</Label>
          <Select name="category_id" required>
            <SelectTrigger><SelectValue placeholder="게시판 선택" /></SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input id="title" name="title" required placeholder="제목을 입력하세요" />
        </div>
        <div className="space-y-2">
          <Label>내용</Label>
          <TipTapEditor onChange={setContent} />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => history.back()}>취소</Button>
          <Button type="submit" disabled={loading}>{loading ? '저장 중...' : '등록'}</Button>
        </div>
      </form>
    </div>
  )
}
