// This file is used to generate static paths for the token page
// It's separated from the client component to avoid conflicts

export function generateStaticParams() {
  // Generate a placeholder parameter that will never be used
  // This allows Next.js to generate the basic route structure
  // Real tokens will be validated client-side
  return [
    { token: 'placeholder-token' }
  ]
}