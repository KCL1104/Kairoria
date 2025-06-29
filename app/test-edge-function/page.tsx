"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/SupabaseAuthContext'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function TestEdgeFunction() {
  const { user } = useAuth()
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testEdgeFunction = async () => {
    if (!user) {
      alert('Please login first')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      // 創建測試數據
      const testData = {
        id: crypto.randomUUID(),
        title: 'Test Product',
        description: 'This is a test product from Edge Function test',
        category_id: '1',
        condition: 'new',
        location: 'Test Location',
        currency: 'usdc',
        price_per_day: '50.00'
      }

      // 創建 FormData
      const formData = new FormData()
      formData.append('productData', JSON.stringify(testData))
      
      // 創建測試圖片文件 (1x1 pixel PNG)
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(0, 0, 1, 1)
      
      canvas.toBlob((blob) => {
        if (blob) {
          const testFile = new File([blob], 'test-image.png', { type: 'image/png' })
          formData.append('images', testFile)
          
          // 調用 Edge Function
          supabase?.functions.invoke('create-product', {
            body: formData
          }).then(({ data, error }) => {
            setResult({ data, error })
            setLoading(false)
          })
        }
      }, 'image/png')

    } catch (error) {
      if (error instanceof Error) {
        setResult({ error: error.message })
      } else {
        setResult({ error: 'An unknown error occurred' })
      }
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
          onClick={testEdgeFunction} 
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