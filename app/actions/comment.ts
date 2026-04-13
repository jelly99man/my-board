'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createComment(postId: number, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const content = formData.get('content') as string
  if (!content.trim()) return { error: '내용을 입력하세요.' }

  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    author_id: user.id,
    content: content.trim(),
  })

  if (error) return { error: error.message }
  revalidatePath(`/posts/${postId}`)
}

export async function deleteComment(commentId: number, postId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', user.id)

  if (error) return { error: error.message }
  revalidatePath(`/posts/${postId}`)
}
