"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function TestEdgeFunction() {
  const { user, session } = useAuth()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleInvokeFunction = async () => {
    if (!user || !session) {
      alert('Please login first')
      return
    }

    setLoading(true)
    setResult(null)

    if (!supabase) {
      setResult({ error: { message: 'Supabase client is not initialized.' } })
      setLoading(false)
      return
    }

    try {
      const productData = {
        id: crypto.randomUUID(), // Add a UUID for the product ID
        title: 'Test Product from Client',
        description: 'This is a detailed description of the test product.',
        category_id: '1',
        condition: 'new',
        location: 'Virtual Location',
        price_per_day: 99.99,
        currency: 'usdc', // Correct the currency
      }

      console.log('Client-side: Sending this productData:', JSON.stringify(productData, null, 2));

      const { data, error } = await supabase.functions.invoke('create-product', {
        body: productData
      })

      if (error) {
        // Handle FunctionsHttpError, FunctionsRelayError, FunctionsFetchError
        if ('message' in error) {
          // This is a FunctionsError object
          setResult({ error: { message: error.message, details: (error as any).details } })
        } else {
          // This is likely a standard Error object
          setResult({ error: { message: (error as Error).message } })
        }
      } else {
        setResult({ data })
      }
    } catch (error) {
      if (error instanceof Error) {
        setResult({ error: { message: error.message } })
      } else {
        setResult({ error: { message: 'An unknown error occurred' } })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-3xl font-bold mb-6">Test Edge Function</h1>
      
      <div className="space-y-4">
        <div>
          <strong>User Status:</strong> {user ? `Logged in as ${user.email}` : 'Not logged in'}
        </div>
        
        <Button 
          onClick={handleInvokeFunction}
          disabled={loading || !user}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test create-product Edge Function'}
        </Button>
        
        {result && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Result:</h3>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}