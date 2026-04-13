import Link from 'next/link'
import { Post } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function PostCard({ post }: { post: Post }) {
  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {post.categories && (
              <Badge variant="outline" className="text-xs shrink-0">
                {post.categories.name}
              </Badge>
            )}
            <Link href={`/posts/${post.id}`} className="font-medium hover:underline truncate">
              {post.title}
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            {post.profiles?.username} ·{' '}
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ko })} ·{' '}
            조회 {post.view_count}
          </p>
        </div>
      </div>
    </div>
  )
}
