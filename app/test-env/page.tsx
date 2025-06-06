"use client"

import { useEffect, useState } from 'react'

export default function TestEnvPage() {
  const [envStatus, setEnvStatus] = useState<any>(null)

  useEffect(() => {
    const checkEnv = () => {
      const envCheck = {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_FOUND',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 
          'NOT_FOUND'
      }
      
      console.log('Client-side env check:', envCheck)
      setEnvStatus(envCheck)
    }

    checkEnv()
  }, [])

  const testServerEnv = async () => {
    try {
      const response = await fetch('/api/debug')
      const data = await response.json()
      console.log('Server-side env check:', data)
      alert('Server env check: ' + JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Error checking server env:', error)
      alert('Error: ' + error)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Client-side Environment Variables:</h2>
          <pre className="bg-gray-100 p-4 rounded mt-2">
            {JSON.stringify(envStatus, null, 2)}
          </pre>
        </div>
        
        <button 
          onClick={testServerEnv}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Server Environment Variables
        </button>
      </div>
    </div>
  )
} 