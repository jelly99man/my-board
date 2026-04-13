import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import PostContent from '@/components/posts/PostContent'
import CommentList from '@/components/comments/CommentList'
import CommentForm from '@/components/comments/CommentForm'
import { deletePost } from '@/app/actions/post'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  await supabase.rpc('increment_view_count', { post_id: parseInt(id) })

  const { data: post } = await supabase
    .from('posts')
    .select('*, profiles(username, avatar_url), categories(name, slug)')
    .eq('id', id)
    .single()

  if (!post) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = post as any

  const { data: { user } } = await supabase.auth.getUser()
  const isAuthor = user?.id === p.author_id

  const { data: comments } = await supabase
    .from('comments')
    .select('*, profiles(username, avatar_url)')
    .eq('post_id', p.id)
    .order('created_at', { ascending: true })

  async function handleDelete() {
    'use server'
    await deletePost(p.id)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            {p.categories && (
              <Link href={`/?category=${p.categories.slug}`}>
                <Badge variant="outline">{p.categories.name}</Badge>
              </Link>
            )}
            <h1 className="text-2xl font-bold">{p.title}</h1>
            <p className="text-sm text-muted-foreground">
              {p.profiles?.username} ·{' '}
              {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: ko })} ·{' '}
              조회 {p.view_count}
            </p>
          </div>
          {isAuthor && (
            <div className="flex gap-2 shrink-0">
              <Link href={`/posts/${p.id}/edit`}>
                <Button variant="outline" size="sm">수정</Button>
              </Link>
              <form action={handleDelete}>
                <Button variant="destructive" size="sm" type="submit">삭제</Button>
              </form>
            </div>
          )}
        </div>
        <Separator className="my-4" />
        <PostContent html={p.content} />
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">댓글 {comments?.length ?? 0}개</h2>
        <CommentList comments={comments ?? []} currentUserId={user?.id} />
        {user ? (
          <CommentForm postId={p.id} />
        ) : (
          <p className="text-sm text-muted-foreground">
            댓글을 작성하려면{' '}
            <Link href="/login" className="underline">로그인</Link>하세요.
          </p>
        )}
      </div>
    </div>
  )
}
