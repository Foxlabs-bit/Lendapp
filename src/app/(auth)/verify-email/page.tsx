import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-primary rounded-xl p-2">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">Lend</span>
        </div>
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 rounded-full p-4 mb-2 w-fit">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>We sent you a confirmation link. Click it to activate your account.</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Didn&apos;t receive it? Check your spam folder, or{' '}
              <Link href="/register" className="text-primary hover:underline">try again</Link>.
            </p>
            <p className="text-sm text-muted-foreground">
              Already confirmed?{' '}
              <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
