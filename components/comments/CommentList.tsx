import { Comment } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { deleteComment } from '@/app/actions/comment'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface CommentListProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  comments: any[]
  currentUserId?: string
}

export default function CommentList({ comments, currentUserId }: CommentListProps) {
  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">댓글이 없습니다.</p>
  }

  return (
    <div className="space-y-4">
      {comments.map((comment, idx) => (
        <div key={comment.id}>
          {idx > 0 && <Separator className="mb-4" />}
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={comment.profiles?.avatar_url ?? undefined} />
              <AvatarFallback>{comment.profiles?.username?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{comment.profiles?.username}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ko })}
                </span>
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
            </div>
            {currentUserId === comment.author_id && (
              <form action={async () => {
                'use server'
                await deleteComment(comment.id, comment.post_id)
              }}>
                <Button
                  variant="ghost" size="sm" type="submit"
                  className="text-muted-foreground hover:text-destructive"
                >
                  삭제
                </Button>
              </form>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
