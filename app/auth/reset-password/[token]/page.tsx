import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ResetPasswordForm from "./ResetPasswordForm"

// Required for static export with dynamic routes
export async function generateStaticParams() {
  // Return a placeholder parameter for static generation
  // Real tokens will be validated client-side
  return [
    { token: 'placeholder-token' }
  ]
}

interface ResetPasswordTokenPageProps {
  params: { token: string }
}

export default function ResetPasswordTokenPage({
  params,
}: ResetPasswordTokenPageProps) {
  return (
    <div className="container max-w-lg py-10">
      <div className="mb-6">
        <Link href="/auth/login" className="text-sm text-muted-foreground flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Link>
      </div>
      
      <div className="flex justify-center mb-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
          <span>Kairoria</span>
        </Link>
      </div>
      
      <ResetPasswordForm token={params.token} />
    </div>
  )
}