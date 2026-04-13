import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PostList from '@/components/posts/PostList'
import CategoryNav from '@/components/layout/CategoryNav'
import { Button } from '@/components/ui/button'
import { Post } from '@/lib/types'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('posts')
    .select('*, profiles(username, avatar_url), categories(name, slug)')
    .order('created_at', { ascending: false })

  if (category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single()
    if (cat) query = query.eq('category_id', cat.id)
  }

  const { data: posts } = await query
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CategoryNav currentSlug={category} />
        {user && (
          <Link href="/posts/new">
            <Button size="sm">글 쓰기</Button>
          </Link>
        )}
      </div>
      <PostList posts={(posts ?? []) as Post[]} />
    </div>
  )
}
