'use client'

import { signInWithGoogle } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import {
  Card, CardContent, CardDescription,
  CardHeader, CardTitle,
} from '@/components/ui/card'

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>로그인</CardTitle>
        <CardDescription>Google 계정으로 로그인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={async () => { await signInWithGoogle() }}>
          <Button type="submit" variant="outline" className="w-full">
            Google로 로그인
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
