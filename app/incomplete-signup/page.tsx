import { redirect } from 'next/navigation'

export default function IncompleteSignupPage() {
  redirect('/complete-signup')
}