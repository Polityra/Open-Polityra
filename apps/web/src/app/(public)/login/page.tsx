import { Suspense } from 'react'
import LoginForm from './login-form'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-sm text-slate-500">
            Loading login...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
