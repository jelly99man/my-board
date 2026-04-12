# 게시판 웹사이트 설계 문서

**날짜:** 2026-04-13  
**스택:** Next.js 15 (App Router) + Supabase + TipTap + Tailwind CSS + shadcn/ui  
**배포:** Vercel

---

## 1. 프로젝트 개요

Next.js와 Supabase를 사용한 커뮤니티 게시판 웹사이트.

**핵심 기능**
- 회원가입 / 로그인 (이메일+비밀번호, 구글 소셜)
- 카테고리별 게시판
- 글 목록 / 작성 / 수정 / 삭제
- TipTap WYSIWYG 리치 텍스트 에디터
- 댓글 작성 / 삭제
- 조회수

**접근 권한**
- 비회원: 글 목록 및 상세 읽기 가능
- 회원: 글 작성, 댓글 작성 가능
- 본인: 자신의 글/댓글만 수정·삭제 가능

---

## 2. 기술 스택

| 역할 | 도구 |
|---|---|
| 프레임워크 | Next.js 15 (App Router) |
| DB / Auth / Storage | Supabase |
| 에디터 | TipTap |
| 소셜 로그인 | Supabase Auth (Google OAuth) |
| 스타일링 | Tailwind CSS + shadcn/ui |
| 배포 | Vercel |

---

## 3. UI 스타일

미니멀 & 클린. 흰 배경, 얇은 테두리, 넓은 여백. 모던 SaaS 스타일.

---

## 4. 페이지 구조

```
/                        글 목록 (전체 or 카테고리 필터)
/posts/[id]              글 상세 + 댓글
/posts/new               글 작성 (로그인 필요)
/posts/[id]/edit         글 수정 (본인만)
/auth/login              로그인
/auth/signup             회원가입
/auth/callback           Google OAuth 콜백
```

---

## 5. Supabase 테이블 설계

### profiles
```sql
id          uuid         PK  -- auth.users.id 참조
username    text         NOT NULL UNIQUE
avatar_url  text
created_at  timestamptz  DEFAULT now()
```

### categories
```sql
id          serial       PK
name        text         NOT NULL UNIQUE  -- 예: "자유게시판"
slug        text         NOT NULL UNIQUE  -- 예: "free"
created_at  timestamptz  DEFAULT now()
```

### posts
```sql
id           bigserial    PK
title        text         NOT NULL
content      text         NOT NULL  -- TipTap HTML
category_id  int          FK → categories.id
author_id    uuid         FK → profiles.id
view_count   int          DEFAULT 0
created_at   timestamptz  DEFAULT now()
updated_at   timestamptz  DEFAULT now()
```

### comments
```sql
id         bigserial    PK
post_id    bigint       FK → posts.id  ON DELETE CASCADE
author_id  uuid         FK → profiles.id
content    text         NOT NULL
created_at timestamptz  DEFAULT now()
```

### RPC 함수

```sql
-- 조회수 증가 (RLS 우회)
CREATE OR REPLACE FUNCTION increment_view_count(post_id bigint)
RETURNS void AS $$
  UPDATE posts SET view_count = view_count + 1 WHERE id = post_id;
$$ LANGUAGE sql SECURITY DEFINER;
```

### RLS 정책

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | 누구나 | Auth trigger 자동 | 본인만 | 없음 |
| categories | 누구나 | 없음 | 없음 | 없음 |
| posts | 누구나 | 로그인 사용자 | 본인만 | 본인만 |
| comments | 누구나 | 로그인 사용자 | 없음 | 본인만 |

### DB Trigger (profiles 자동 생성)

```sql
-- auth.users에 새 유저 생성 시 profiles 자동 삽입
CREATE OR REPLACE FUNCTION handle_new_user()
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
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

---

## 6. 인증 흐름

```
회원가입:  이메일 입력 → Supabase Auth 가입 → 이메일 인증 →
           profiles 레코드 자동 생성 (DB trigger)

이메일 로그인: 이메일/비밀번호 → Supabase Auth → 세션 쿠키 발급

구글 로그인:  OAuth 시작 → /auth/callback 처리 →
             Supabase Auth → 세션 쿠키 발급

세션 유지:  @supabase/ssr로 서버/클라이언트 세션 공유
            middleware.ts에서 모든 요청마다 세션 갱신
```

---

## 7. 데이터 흐름 (Server Actions)

모든 CRUD는 Server Actions로 처리.

```
[폼 제출] → Server Action
  → supabase.auth.getUser() 로그인 확인
  → DB 작업 (insert / update / delete)
  → revalidatePath() 로 캐시 무효화
  → redirect() 또는 응답 반환
```

글 상세 페이지 로드 시 `increment_view_count` RPC 호출로 조회수 증가.

---

## 8. 파일 구조

```
app/
  (auth)/
    login/page.tsx
    signup/page.tsx
  auth/
    callback/route.ts          ← OAuth 콜백
  (board)/
    page.tsx                   ← 글 목록
    posts/
      [id]/page.tsx            ← 글 상세
      [id]/edit/page.tsx       ← 글 수정
      new/page.tsx             ← 글 작성
  actions/
    post.ts                    ← 글 Server Actions
    comment.ts                 ← 댓글 Server Actions
  globals.css
  layout.tsx
components/
  editor/
    TipTapEditor.tsx           ← 리치 텍스트 에디터
  posts/
    PostList.tsx
    PostCard.tsx
  comments/
    CommentList.tsx
    CommentForm.tsx
  ui/                          ← shadcn/ui 컴포넌트
lib/
  supabase/
    server.ts                  ← 서버용 Supabase 클라이언트
    client.ts                  ← 클라이언트용 Supabase 클라이언트
middleware.ts                  ← 세션 갱신
```

---

## 9. 환경변수

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

Supabase 대시보드 → Project Settings → API에서 확인.  
Google OAuth는 Supabase 대시보드 → Authentication → Providers → Google에서 설정.

---

## 10. 초기 카테고리 데이터

```sql
INSERT INTO categories (name, slug) VALUES
  ('자유게시판', 'free'),
  ('질문답변', 'qna'),
  ('공지사항', 'notice');
```
