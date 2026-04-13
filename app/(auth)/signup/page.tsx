'use client'

import { signInWithGoogle } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle,
} from '@/components/ui/card'

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>회원가입</CardTitle>
        <CardDescription>Google 계정으로 시작하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={async () => { await signInWithGoogle() }}>
          <Button type="submit" variant="outline" className="w-full">
            Google로 시작하기
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
