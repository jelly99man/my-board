import Header from '@/components/layout/Header'

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
