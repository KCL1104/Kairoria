"use client"

import { useState } from 'react'
import { useTokenPersistence, useTokenStorageDebug } from '@/hooks/use-token-persistence'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RefreshCw, Trash2, Eye, EyeOff, CheckCircle, XCircle, Clock } from 'lucide-react'

/**
 * Demo component to showcase token persistence functionality
 * This can be used for testing and debugging authentication token storage
 */
export function TokenPersistenceDemo() {
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const {
    isTokenValid,
    tokenData,
    isLoading,
    lastChecked,
    checkTokenValidity,
    refreshTokens,
    clearTokens,
    isExpiringSoon,
    timeUntilExpiry
  } = useTokenPersistence()

  const { debugInfo, logDebugInfo } = useTokenStorageDebug()

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isTokenValid ? 'bg-green-500' : 'bg-red-500'}`} />
          Token Persistence Status
        </CardTitle>
        <CardDescription>
          Monitor and manage authentication token storage across browser tabs and sessions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {isTokenValid ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm font-medium">
                Token Status: {isTokenValid ? 'Valid' : 'Invalid/Missing'}
              </span>
            </div>
            
            {isExpiringSoon && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600">
                  Expires in: {formatDuration(timeUntilExpiry)}
                </span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Last Checked:</span>
              <br />
              {lastChecked ? formatTime(lastChecked) : 'Never'}
            </div>
            
            {tokenData && (
              <div className="text-sm">
                <span className="font-medium">User ID:</span>
                <br />
                <code className="text-xs">{tokenData.user_id.slice(0, 8)}...</code>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={checkTokenValidity}
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Check Tokens
          </Button>
          
          <Button
            onClick={refreshTokens}
            disabled={isLoading || !tokenData}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Tokens
          </Button>
          
          <Button
            onClick={clearTokens}
            disabled={isLoading}
            size="sm"
            variant="destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Tokens
          </Button>
          
          <Button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            size="sm"
            variant="ghost"
          >
            {showDebugInfo ? (
              <EyeOff className="w-4 h-4 mr-2" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            {showDebugInfo ? 'Hide' : 'Show'} Debug Info
          </Button>
          
          <Button
            onClick={logDebugInfo}
            size="sm"
            variant="ghost"
          >
            Log to Console
          </Button>
        </div>

        {/* Token Information */}
        {tokenData && (
          <div className="space-y-3">
            <h4 className="font-medium">Token Information</h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="font-medium">Access Token:</span>
                <code className="ml-2 text-xs bg-muted px-1 rounded">
                  {tokenData.access_token.slice(0, 20)}...
                </code>
              </div>
              <div>
                <span className="font-medium">Expires At:</span>
                <span className="ml-2">{formatTime(tokenData.expires_at)}</span>
              </div>
              <div>
                <span className="font-medium">Session ID:</span>
                <code className="ml-2 text-xs bg-muted px-1 rounded">
                  {tokenData.session_id}
                </code>
              </div>
            </div>
          </div>
        )}

        {/* Debug Information */}
        {showDebugInfo && (
          <div className="space-y-3">
            <h4 className="font-medium">Storage Debug Information</h4>
            
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">localStorage</Badge>
                  <Badge variant={debugInfo.localStorage ? 'default' : 'secondary'}>
                    {debugInfo.localStorage ? 'Has Data' : 'Empty'}
                  </Badge>
                </div>
                {debugInfo.localStorage && (
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(debugInfo.localStorage, null, 2)}
                  </pre>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">sessionStorage</Badge>
                  <Badge variant={debugInfo.sessionStorage ? 'default' : 'secondary'}>
                    {debugInfo.sessionStorage ? 'Has Data' : 'Empty'}
                  </Badge>
                </div>
                {debugInfo.sessionStorage && (
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(debugInfo.sessionStorage, null, 2)}
                  </pre>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Cookies</Badge>
                  <Badge variant={Object.keys(debugInfo.cookies).length > 0 ? 'default' : 'secondary'}>
                    {Object.keys(debugInfo.cookies).length} cookies
                  </Badge>
                </div>
                {Object.keys(debugInfo.cookies).length > 0 && (
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(debugInfo.cookies, null, 2)}
                  </pre>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Custom Storage</Badge>
                  <Badge variant={debugInfo.customStorage ? 'default' : 'secondary'}>
                    {debugInfo.customStorage ? 'Has Data' : 'Empty'}
                  </Badge>
                </div>
                {debugInfo.customStorage && (
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(debugInfo.customStorage, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Testing Cross-Tab Sync:</strong> Open this page in multiple tabs and perform actions to see real-time synchronization.</p>
          <p><strong>Testing Persistence:</strong> Refresh the page or close/reopen the browser to verify token persistence.</p>
          <p><strong>Testing Expiration:</strong> Wait for tokens to expire or manually clear them to test refresh behavior.</p>
        </div>
      </CardContent>
    </Card>
  )
}