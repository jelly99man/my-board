'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const categoryId = formData.get('category_id') as string

  if (!title.trim() || !content.trim()) {
    return { error: '제목과 내용을 입력하세요.' }
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({ title: title.trim(), content, category_id: parseInt(categoryId), author_id: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/')
  redirect(`/posts/${data.id}`)
}

export async function updatePost(postId: number, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const categoryId = formData.get('category_id') as string

  const { error } = await supabase
    .from('posts')
    .update({ title: title.trim(), content, category_id: parseInt(categoryId), updated_at: new Date().toISOString() })
    .eq('id', postId)
    .eq('author_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath(`/posts/${postId}`)
  redirect(`/posts/${postId}`)
}

export async function deletePost(postId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  redirect('/')
}
