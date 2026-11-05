import { Suspense } from 'react'
import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050a12]">
          <div className="animate-pulse font-mono text-xs uppercase tracking-[0.18em] text-cyan-200">
            Loading login...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
