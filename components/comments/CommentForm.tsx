'use client'

import { useState } from 'react'
import { createComment } from '@/app/actions/comment'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export default function CommentForm({ postId }: { postId: number }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await createComment(postId, formData)
    if (result?.error) {
      setError(result.error)
    } else {
      const form = document.getElementById('comment-form') as HTMLFormElement
      form?.reset()
    }
    setLoading(false)
  }

  return (
    <form id="comment-form" action={handleSubmit} className="space-y-2">
      <Textarea name="content" placeholder="댓글을 입력하세요..." rows={3} required />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? '등록 중...' : '댓글 등록'}
        </Button>
      </div>
    </form>
  )
}
