# 게시판 웹사이트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next.js 15 + Supabase 기반 커뮤니티 게시판 웹사이트 구축 (글 CRUD, 댓글, 조회수, 이메일/구글 인증)

**Architecture:** App Router + Server Components로 데이터 페칭, Server Actions로 모든 뮤테이션 처리. Supabase SSR 헬퍼로 서버/클라이언트 세션 공유. RLS로 DB 레벨 접근 제어. TipTap HTML 출력은 DOMPurify로 살균 후 렌더링.

**Tech Stack:** Next.js 15, Supabase (@supabase/ssr), TipTap, Tailwind CSS, shadcn/ui, DOMPurify

---

## 파일 구조 전체 맵

```
app/
  layout.tsx                        ← 루트 레이아웃 (폰트, globals)
  globals.css
  (auth)/
    layout.tsx                      ← 인증 레이아웃
    login/page.tsx                  ← 로그인 폼
    signup/page.tsx                 ← 회원가입 폼
  auth/
    callback/route.ts               ← Google OAuth 콜백
  (board)/
    layout.tsx                      ← 게시판 레이아웃 (Header 포함)
    page.tsx                        ← 글 목록 (카테고리 필터)
    posts/
      new/page.tsx                  ← 글 작성
      [id]/page.tsx                 ← 글 상세 + 댓글
      [id]/edit/page.tsx            ← 글 수정
  actions/
    post.ts                         ← 글 Server Actions
    comment.ts                      ← 댓글 Server Actions
    auth.ts                         ← 인증 Server Actions
components/
  layout/
    Header.tsx                      ← 상단 헤더 (로고, 유저 메뉴)
    CategoryNav.tsx                 ← 카테고리 탭 네비게이션
  editor/
    TipTapEditor.tsx                ← TipTap 리치 텍스트 에디터
  posts/
    PostCard.tsx                    ← 글 목록 카드 한 줄
    PostList.tsx                    ← 글 목록 컨테이너
    PostContent.tsx                 ← 살균된 HTML 렌더러 (클라이언트)
  comments/
    CommentList.tsx                 ← 댓글 목록
    CommentForm.tsx                 ← 댓글 작성 폼
lib/
  supabase/
    server.ts                       ← 서버용 Supabase 클라이언트
    client.ts                       ← 클라이언트용 Supabase 클라이언트
  types.ts                          ← 공유 TypeScript 타입
middleware.ts                       ← 세션 갱신
```

---

## Task 1: 프로젝트 부트스트랩

**Files:**
- Create: 프로젝트 루트 (Next.js 앱 생성)
- Create: `.env.local`
- Create: `middleware.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/client.ts`
- Create: `lib/types.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
cd /Users/ppuraktak/Dropbox/my-board-project
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

프롬프트: 기본값으로 진행 (엔터)

- [ ] **Step 2: 의존성 설치**

```bash
npm install @supabase/ssr @supabase/supabase-js
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-placeholder
npm install dompurify
npm install --save-dev @types/dompurify
npm install date-fns
npx shadcn@latest init
```

shadcn init 프롬프트:
- Style: Default
- Base color: Zinc
- CSS variables: Yes

- [ ] **Step 3: shadcn 컴포넌트 설치**

```bash
npx shadcn@latest add button input label textarea card \
  badge separator dropdown-menu avatar select
```

- [ ] **Step 4: `@tailwindcss/typography` 설치**

```bash
npm install @tailwindcss/typography
```

`tailwind.config.ts`의 plugins 배열에 추가:
```typescript
plugins: [require('@tailwindcss/typography')]
```

- [ ] **Step 5: `.env.local` 생성**

```env
NEXT_PUBLIC_SUPABASE_URL=여기에_supabase_url_입력
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_key_입력
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Supabase 대시보드 → Project Settings → API → Project URL / anon key 복사

- [ ] **Step 6: `lib/supabase/server.ts` 생성**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 7: `lib/supabase/client.ts` 생성**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 8: `lib/types.ts` 생성**

```typescript
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
```

- [ ] **Step 9: `middleware.ts` 생성**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 10: `app/layout.tsx` 업데이트**

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '게시판',
  description: '커뮤니티 게시판',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 11: 개발 서버 확인**

```bash
npm run dev
```

http://localhost:3000 접속 → Next.js 기본 화면 표시 확인

- [ ] **Step 12: 커밋**

```bash
git init
git add .
git commit -m "feat: bootstrap Next.js project with Supabase, TipTap, DOMPurify"
```

---

## Task 2: Supabase 데이터베이스 설정

**Files:**
- Create: `supabase/schema.sql` (참고용, 실제 실행은 대시보드에서)

- [ ] **Step 1: Supabase 대시보드에서 SQL 에디터 열기**

Supabase 대시보드 → SQL Editor → New query

- [ ] **Step 2: 테이블 생성 SQL 실행**

```sql
-- profiles 테이블
CREATE TABLE public.profiles (
  id          uuid         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    text         NOT NULL UNIQUE,
  avatar_url  text,
  created_at  timestamptz  DEFAULT now()
);

-- categories 테이블
CREATE TABLE public.categories (
  id          serial       PRIMARY KEY,
  name        text         NOT NULL UNIQUE,
  slug        text         NOT NULL UNIQUE,
  created_at  timestamptz  DEFAULT now()
);

-- posts 테이블
CREATE TABLE public.posts (
  id           bigserial    PRIMARY KEY,
  title        text         NOT NULL,
  content      text         NOT NULL,
  category_id  int          REFERENCES public.categories(id),
  author_id    uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  view_count   int          DEFAULT 0,
  created_at   timestamptz  DEFAULT now(),
  updated_at   timestamptz  DEFAULT now()
);

-- comments 테이블
CREATE TABLE public.comments (
  id         bigserial    PRIMARY KEY,
  post_id    bigint       NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id  uuid         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content    text         NOT NULL,
  created_at timestamptz  DEFAULT now()
);
```

- [ ] **Step 3: RLS 활성화 및 정책 설정**

```sql
-- RLS 활성화
ALTER TABLE public.profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments   ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "누구나 프로필 읽기"  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "본인 프로필 수정"    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- categories
CREATE POLICY "누구나 카테고리 읽기" ON public.categories FOR SELECT USING (true);

-- posts
CREATE POLICY "누구나 글 읽기"        ON public.posts FOR SELECT USING (true);
CREATE POLICY "로그인 사용자 글 작성" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "본인 글 수정"          ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "본인 글 삭제"          ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- comments
CREATE POLICY "누구나 댓글 읽기"        ON public.comments FOR SELECT USING (true);
CREATE POLICY "로그인 사용자 댓글 작성" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "본인 댓글 삭제"          ON public.comments FOR DELETE USING (auth.uid() = author_id);
```

- [ ] **Step 4: 조회수 RPC 함수 생성**

```sql
CREATE OR REPLACE FUNCTION increment_view_count(post_id bigint)
RETURNS void AS $$
  UPDATE public.posts SET view_count = view_count + 1 WHERE id = post_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

- [ ] **Step 5: 신규 유저 profiles 자동 생성 트리거**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

- [ ] **Step 6: 초기 카테고리 데이터 삽입**

```sql
INSERT INTO public.categories (name, slug) VALUES
  ('자유게시판', 'free'),
  ('질문답변',   'qna'),
  ('공지사항',   'notice');
```

- [ ] **Step 7: 스키마 참고 파일 저장**

위 SQL을 모두 `supabase/schema.sql`에 저장 (문서화용)

- [ ] **Step 8: 커밋**

```bash
git add supabase/schema.sql
git commit -m "feat: add Supabase schema reference file"
```

---

## Task 3: 인증 — 이메일/비밀번호 + Google OAuth

**Files:**
- Create: `app/actions/auth.ts`
- Create: `app/auth/callback/route.ts`
- Create: `app/(auth)/layout.tsx`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`

- [ ] **Step 1: `app/actions/auth.ts` 생성**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  if (error) return { error: error.message }
  redirect(data.url)
}
```

- [ ] **Step 2: `app/auth/callback/route.ts` 생성**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}/`)
}
```

- [ ] **Step 3: `app/(auth)/layout.tsx` 생성**

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-4">{children}</div>
    </div>
  )
}
```

- [ ] **Step 4: `app/(auth)/login/page.tsx` 생성**

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login, signInWithGoogle } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>로그인</CardTitle>
        <CardDescription>계정에 로그인하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
        <Separator />
        <form action={signInWithGoogle}>
          <Button type="submit" variant="outline" className="w-full">
            Google로 로그인
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="underline">회원가입</Link>
        </p>
      </CardFooter>
    </Card>
  )
}
```

- [ ] **Step 5: `app/(auth)/signup/page.tsx` 생성**

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card, CardContent, CardDescription,
  CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>회원가입</CardTitle>
        <CardDescription>새 계정을 만드세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="underline">로그인</Link>
        </p>
      </CardFooter>
    </Card>
  )
}
```

- [ ] **Step 6: Google OAuth Supabase 설정**

Supabase 대시보드 → Authentication → Providers → Google 활성화

Google Cloud Console (console.cloud.google.com):
1. 새 프로젝트 → APIs & Services → Credentials
2. OAuth 2.0 Client ID 생성 (Web application)
3. Authorized redirect URIs 추가:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Client ID / Client Secret을 Supabase Google Provider에 입력

- [ ] **Step 7: 인증 테스트**

```bash
npm run dev
```

1. http://localhost:3000/signup → 이메일/비밀번호 가입
2. Supabase 대시보드 → Authentication → Users 에서 유저 확인
3. profiles 테이블에 레코드 자동 생성 확인
4. http://localhost:3000/login → 로그인

- [ ] **Step 8: 커밋**

```bash
git add .
git commit -m "feat: add email/password and Google OAuth authentication"
```

---

## Task 4: 레이아웃 & 헤더

**Files:**
- Create: `components/layout/Header.tsx`
- Create: `components/layout/CategoryNav.tsx`
- Create: `app/(board)/layout.tsx`

- [ ] **Step 1: `components/layout/Header.tsx` 생성**

```typescript
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { logout } from '@/app/actions/auth'

export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">게시판</Link>
        <div className="flex items-center gap-3">
          {user && profile ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback>{profile.username[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{profile.username}</span>
              <form action={logout}>
                <Button variant="ghost" size="sm" type="submit">로그아웃</Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">로그인</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">회원가입</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: `components/layout/CategoryNav.tsx` 생성**

```typescript
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
```

- [ ] **Step 3: `app/(board)/layout.tsx` 생성**

```typescript
import Header from '@/components/layout/Header'

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 4: 레이아웃 확인**

http://localhost:3000 → 헤더 로고 + 로그인/회원가입 버튼 확인  
로그인 후 → 헤더에 아바타 + 유저명 + 로그아웃 버튼 확인

- [ ] **Step 5: 커밋**

```bash
git add .
git commit -m "feat: add layout, header, and category navigation"
```

---

## Task 5: 글 목록 페이지

**Files:**
- Create: `components/posts/PostCard.tsx`
- Create: `components/posts/PostList.tsx`
- Create: `app/(board)/page.tsx`

- [ ] **Step 1: `components/posts/PostCard.tsx` 생성**

```typescript
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
```

- [ ] **Step 2: `components/posts/PostList.tsx` 생성**

```typescript
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
```

- [ ] **Step 3: `app/(board)/page.tsx` 생성**

```typescript
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PostList from '@/components/posts/PostList'
import CategoryNav from '@/components/layout/CategoryNav'
import { Button } from '@/components/ui/button'

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
      <PostList posts={posts ?? []} />
    </div>
  )
}
```

- [ ] **Step 4: 글 목록 확인**

Supabase 대시보드 → Table Editor → posts → Insert row로 테스트 글 삽입 후  
http://localhost:3000 에서 목록 표시 확인, 카테고리 Badge 클릭으로 필터 확인

- [ ] **Step 5: 커밋**

```bash
git add .
git commit -m "feat: add post list page with category filter"
```

---

## Task 6: TipTap 에디터 & 글 작성

**Files:**
- Create: `components/editor/TipTapEditor.tsx`
- Create: `app/actions/post.ts`
- Create: `app/(board)/posts/new/page.tsx`

- [ ] **Step 1: `components/editor/TipTapEditor.tsx` 생성**

```typescript
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'

interface TipTapEditorProps {
  content?: string
  onChange: (html: string) => void
}

export default function TipTapEditor({ content = '', onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: false,
  })

  if (!editor) return null

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex gap-1 p-2 border-b bg-gray-50 flex-wrap">
        <Button type="button" size="sm"
          variant={editor.isActive('bold') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </Button>
        <Button type="button" size="sm"
          variant={editor.isActive('italic') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </Button>
        <Button type="button" size="sm"
          variant={editor.isActive('strike') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <s>S</s>
        </Button>
        <Button type="button" size="sm"
          variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          • 목록
        </Button>
        <Button type="button" size="sm"
          variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          1. 목록
        </Button>
        <Button type="button" size="sm"
          variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          코드
        </Button>
        <Button type="button" size="sm" variant="ghost"
          onClick={() => editor.chain().focus().undo().run()}>↩</Button>
        <Button type="button" size="sm" variant="ghost"
          onClick={() => editor.chain().focus().redo().run()}>↪</Button>
      </div>
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[200px] [&_.ProseMirror]:outline-none"
      />
    </div>
  )
}
```

- [ ] **Step 2: `app/actions/post.ts` 생성**

```typescript
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
```

- [ ] **Step 3: `app/(board)/posts/new/page.tsx` 생성**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { createPost } from '@/app/actions/post'
import TipTapEditor from '@/components/editor/TipTapEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { Category } from '@/lib/types'

export default function NewPostPage() {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    createClient().from('categories').select('*').order('id').then(({ data }) => {
      if (data) setCategories(data)
    })
  }, [])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.set('content', content)
    const result = await createPost(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border rounded-lg p-6 space-y-4">
      <h1 className="text-xl font-bold">글 쓰기</h1>
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>게시판</Label>
          <Select name="category_id" required>
            <SelectTrigger><SelectValue placeholder="게시판 선택" /></SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input id="title" name="title" required placeholder="제목을 입력하세요" />
        </div>
        <div className="space-y-2">
          <Label>내용</Label>
          <TipTapEditor onChange={setContent} />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => history.back()}>취소</Button>
          <Button type="submit" disabled={loading}>{loading ? '저장 중...' : '등록'}</Button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: 글 작성 테스트**

1. 로그인 후 http://localhost:3000/posts/new 접속
2. 카테고리 선택, 제목 입력, TipTap으로 내용 작성 (볼드, 목록, 코드 블록 테스트)
3. 등록 → 글 상세 페이지로 리디렉션 확인

- [ ] **Step 5: 커밋**

```bash
git add .
git commit -m "feat: add TipTap editor and post creation"
```

---

## Task 7: 보안 — DOMPurify HTML 살균 컴포넌트

TipTap이 출력하는 HTML을 화면에 렌더링할 때 XSS 공격을 방지하기 위해
서버에서 저장된 HTML이라도 클라이언트 렌더링 전에 DOMPurify로 살균합니다.

**Files:**
- Create: `components/posts/PostContent.tsx`

- [ ] **Step 1: `components/posts/PostContent.tsx` 생성**

```typescript
'use client'

import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'

export default function PostContent({ html }: { html: string }) {
  const [clean, setClean] = useState('')

  useEffect(() => {
    setClean(
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
          'p','br','strong','em','s','u','h1','h2','h3','h4','h5','h6',
          'ul','ol','li','blockquote','pre','code','hr',
        ],
        ALLOWED_ATTR: [],
      })
    )
  }, [html])

  return (
    <div
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
```

DOMPurify는 브라우저 DOM API가 필요하므로 `'use client'` + `useEffect` 안에서만 실행합니다.  
`clean`이 빌드되기 전 SSR 단계에서는 빈 문자열로 시작하므로 XSS 노출 없이 안전합니다.

- [ ] **Step 2: 커밋**

```bash
git add components/posts/PostContent.tsx
git commit -m "feat: add DOMPurify sanitizer for TipTap HTML output"
```

---

## Task 8: 글 상세 페이지 (조회수 포함)

**Files:**
- Create: `app/(board)/posts/[id]/page.tsx`

- [ ] **Step 1: `app/(board)/posts/[id]/page.tsx` 생성**

```typescript
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

  // 조회수 증가
  await supabase.rpc('increment_view_count', { post_id: parseInt(id) })

  const { data: post } = await supabase
    .from('posts')
    .select('*, profiles(username, avatar_url), categories(name, slug)')
    .eq('id', id)
    .single()

  if (!post) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isAuthor = user?.id === post.author_id

  const { data: comments } = await supabase
    .from('comments')
    .select('*, profiles(username, avatar_url)')
    .eq('post_id', post.id)
    .order('created_at', { ascending: true })

  async function handleDelete() {
    'use server'
    await deletePost(post.id)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            {post.categories && (
              <Link href={`/?category=${post.categories.slug}`}>
                <Badge variant="outline">{post.categories.name}</Badge>
              </Link>
            )}
            <h1 className="text-2xl font-bold">{post.title}</h1>
            <p className="text-sm text-muted-foreground">
              {post.profiles?.username} ·{' '}
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ko })} ·{' '}
              조회 {post.view_count}
            </p>
          </div>
          {isAuthor && (
            <div className="flex gap-2 shrink-0">
              <Link href={`/posts/${post.id}/edit`}>
                <Button variant="outline" size="sm">수정</Button>
              </Link>
              <form action={handleDelete}>
                <Button variant="destructive" size="sm" type="submit">삭제</Button>
              </form>
            </div>
          )}
        </div>
        <Separator className="my-4" />
        {/* PostContent가 DOMPurify로 살균 후 렌더링 */}
        <PostContent html={post.content} />
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">댓글 {comments?.length ?? 0}개</h2>
        <CommentList comments={comments ?? []} currentUserId={user?.id} />
        {user ? (
          <CommentForm postId={post.id} />
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
```

- [ ] **Step 2: 글 상세 확인**

1. 글 목록 클릭 → 상세 페이지 이동
2. 새로고침마다 조회수 +1 확인 (Supabase 대시보드)
3. 본인 글 → 수정/삭제 버튼 표시
4. 타인 글 → 버튼 없음

- [ ] **Step 3: 커밋**

```bash
git add .
git commit -m "feat: add post detail page with view count and sanitized content"
```

---

## Task 9: 글 수정

**Files:**
- Create: `app/(board)/posts/[id]/edit/page.tsx`

- [ ] **Step 1: `app/(board)/posts/[id]/edit/page.tsx` 생성**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { updatePost } from '@/app/actions/post'
import TipTapEditor from '@/components/editor/TipTapEditor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { Category, Post } from '@/lib/types'

export default function EditPostPage() {
  const params = useParams<{ id: string }>()
  const postId = parseInt(params.id)
  const [post, setPost] = useState<Post | null>(null)
  const [content, setContent] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('posts').select('*').eq('id', postId).single(),
      supabase.from('categories').select('*').order('id'),
    ]).then(([{ data: postData }, { data: catData }]) => {
      if (postData) { setPost(postData); setContent(postData.content) }
      if (catData) setCategories(catData)
    })
  }, [postId])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.set('content', content)
    const result = await updatePost(postId, formData)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  if (!post) {
    return <div className="text-center py-16 text-muted-foreground">불러오는 중...</div>
  }

  return (
    <div className="bg-white border rounded-lg p-6 space-y-4">
      <h1 className="text-xl font-bold">글 수정</h1>
      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>게시판</Label>
          <Select name="category_id" defaultValue={String(post.category_id)} required>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input id="title" name="title" defaultValue={post.title} required />
        </div>
        <div className="space-y-2">
          <Label>내용</Label>
          <TipTapEditor content={post.content} onChange={setContent} />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => history.back()}>취소</Button>
          <Button type="submit" disabled={loading}>{loading ? '저장 중...' : '수정 완료'}</Button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: 글 수정 테스트**

1. 본인 글 상세 → 수정 클릭
2. 내용 변경 후 수정 완료 → 상세 페이지에서 변경 내용 확인
3. 타인 글 수정 URL 직접 접근 시 저장 불가 확인 (RLS)

- [ ] **Step 3: 커밋**

```bash
git add .
git commit -m "feat: add post edit page"
```

---

## Task 10: 댓글

**Files:**
- Create: `app/actions/comment.ts`
- Create: `components/comments/CommentList.tsx`
- Create: `components/comments/CommentForm.tsx`

- [ ] **Step 1: `app/actions/comment.ts` 생성**

```typescript
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
```

- [ ] **Step 2: `components/comments/CommentList.tsx` 생성**

```typescript
import { Comment } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { deleteComment } from '@/app/actions/comment'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface CommentListProps {
  comments: Comment[]
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
```

- [ ] **Step 3: `components/comments/CommentForm.tsx` 생성**

```typescript
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
```

- [ ] **Step 4: 댓글 테스트**

1. 글 상세에서 댓글 작성 → 목록에 표시 확인
2. 본인 댓글에만 삭제 버튼 표시 확인
3. 삭제 후 목록에서 사라짐 확인
4. 비로그인 상태 → "로그인하세요" 메시지 확인

- [ ] **Step 5: 커밋**

```bash
git add .
git commit -m "feat: add comment create and delete"
```

---

## Task 11: 빌드 확인 & 배포

**Files:**
- Create: Vercel 환경변수 (대시보드)

- [ ] **Step 1: TypeScript & 빌드 에러 확인**

```bash
npm run build
```

에러 없으면 아래와 같은 출력:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages
```

- [ ] **Step 2: 전체 기능 최종 점검 체크리스트**

| 기능 | 확인 방법 |
|---|---|
| 회원가입 | 이메일 가입 → Supabase profiles 레코드 생성 |
| 이메일 로그인 | 헤더에 유저명 표시 |
| 구글 로그인 | OAuth → 콜백 → 로그인 완료 |
| 로그아웃 | 헤더 상태 초기화 |
| 글 목록 | 카테고리 필터 동작 |
| 글 작성 | TipTap 에디터 → 등록 → 상세 이동 |
| 글 상세 | 조회수 증가, HTML 올바르게 렌더링 |
| 글 수정 | 기존 내용 로드 → 변경 → 저장 |
| 글 삭제 | 삭제 후 목록으로 이동 |
| 댓글 작성 | 등록 후 목록 갱신 |
| 댓글 삭제 | 본인 댓글만 삭제 가능 |
| XSS 방어 | script 태그가 포함된 HTML 저장 후 렌더링 시 실행되지 않음 |

- [ ] **Step 3: Vercel 배포**

```bash
npx vercel
```

또는 GitHub push 후 Vercel 대시보드에서 프로젝트 연결

- [ ] **Step 4: Vercel 환경변수 설정**

Vercel 대시보드 → Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL      = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
NEXT_PUBLIC_SITE_URL          = https://your-app.vercel.app
```

- [ ] **Step 5: Supabase Google OAuth 리디렉션 URL 추가**

Supabase 대시보드 → Authentication → URL Configuration → Redirect URLs:
```
https://your-app.vercel.app/auth/callback
```

- [ ] **Step 6: 프로덕션 배포 확인**

배포된 URL에서 전체 기능 재확인

- [ ] **Step 7: 최종 커밋**

```bash
git add .
git commit -m "chore: production deployment complete"
```
