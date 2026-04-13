import PostCard from './PostCard'
import { Post } from '@/lib/types'

export default function PostList({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        아직 글이 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
