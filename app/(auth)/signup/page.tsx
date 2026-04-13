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
  const [sent, setSent] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>이메일을 확인해주세요</CardTitle>
          <CardDescription>가입하신 이메일로 인증 링크를 보냈습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            이메일의 인증 링크를 클릭하면 로그인됩니다.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="text-sm underline">로그인 페이지로 돌아가기</Link>
        </CardFooter>
      </Card>
    )
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
