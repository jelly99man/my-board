export type Profile = {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export type Category = {
  id: number
  name: string
  slug: string
  created_at: string
}

export type Post = {
  id: number
  title: string
  content: string
  category_id: number
  author_id: string
  view_count: number
  created_at: string
  updated_at: string
  profiles?: Profile
  categories?: Category
}

export type Comment = {
  id: number
  post_id: number
  author_id: string
  content: string
  created_at: string
  profiles?: Profile
}

// Join types — used when querying with related data
// Supabase join: select('*, profiles(*), categories(*)')
export type PostWithRelations = Omit<Post, 'profiles' | 'categories'> & {
  profiles: Profile
  categories: Category
}

export type CommentWithProfile = Omit<Comment, 'profiles'> & {
  profiles: Profile
}
