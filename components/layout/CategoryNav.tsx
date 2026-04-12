import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'

export default async function CategoryNav({ currentSlug }: { currentSlug?: string }) {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('*').order('id')

  return (
    <nav className="flex gap-2 flex-wrap">
      <Link href="/">
        <Badge variant={!currentSlug ? 'default' : 'outline'}>전체</Badge>
      </Link>
      {categories?.map((cat) => (
        <Link key={cat.id} href={`/?category=${cat.slug}`}>
          <Badge variant={currentSlug === cat.slug ? 'default' : 'outline'}>
            {cat.name}
          </Badge>
        </Link>
      ))}
    </nav>
  )
}
