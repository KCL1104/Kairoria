import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ResetPasswordForm from "./ResetPasswordForm"

interface ResetPasswordTokenPageProps {
  params: Promise<{ token: string }>
}

export default async function ResetPasswordTokenPage({
  params,
}: ResetPasswordTokenPageProps) {
  const { token } = await params
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
      
      <ResetPasswordForm token={token} />
    </div>
  )
}