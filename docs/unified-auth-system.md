# 統一認證系統 (Unified Authentication System)

## 概述

統一認證系統提供了一個單一的 API 端點來處理所有類型的用戶認證，包括密碼登入、OAuth、魔法連結和手機驗證。這個系統簡化了前端的認證邏輯，並提供了一致的用戶體驗。

## 架構設計

### 核心組件

1. **統一 API 端點** (`/api/auth/unified-login`)
   - 處理所有登入類型的單一入口點
   - 統一的請求/響應格式
   - 集中的錯誤處理和日誌記錄

2. **認證 Hook** (`useUnifiedAuth`)
   - 提供 React Hook 介面
   - 狀態管理和錯誤處理
   - 類型安全的 TypeScript 支援

3. **統一登入組件** (`UnifiedLoginForm`)
   - 可重用的 UI 組件
   - 支援多種登入方式的標籤介面
   - 內建表單驗證

## 支援的認證方式

### 1. 密碼登入 (Password Authentication)
```json
{
  "loginType": "password",
  "email": "user@example.com",
  "password": "password123"
}
```

### 2. OAuth 登入 (OAuth Authentication)
```json
{
  "loginType": "oauth",
  "provider": "google",
  "redirectTo": "/dashboard"
}
```

支援的 OAuth 提供商：
- Google
- Facebook
- GitHub
- Apple

### 3. 魔法連結 (Magic Link)
```json
{
  "loginType": "magic_link",
  "email": "user@example.com",
  "redirectTo": "/dashboard"
}
```

### 4. 手機驗證 (Phone Authentication)
```json
{
  "loginType": "phone",
  "phone": "+1234567890",
  "token": "123456"
}
```

## API 文檔

### POST /api/auth/unified-login

統一登入端點，處理所有類型的認證請求。

#### 請求格式

```typescript
interface LoginRequest {
  loginType: 'password' | 'oauth' | 'magic_link' | 'phone'
  email?: string
  password?: string
  provider?: 'google' | 'facebook' | 'github' | 'apple'
  phone?: string
  token?: string
  redirectTo?: string
}
```

#### 響應格式

```typescript
interface LoginResponse {
  success: boolean
  message: string
  loginMethod?: string
  user?: {
    id: string
    email: string
    name: string
    profile: any
  }
  session?: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}
```

#### 狀態碼

- `200` - 登入成功
- `400` - 請求參數錯誤
- `401` - 認證失敗
- `500` - 伺服器內部錯誤

### GET /api/auth/unified-login

獲取支援的登入類型資訊。

#### 響應格式

```typescript
interface SupportedLoginTypesResponse {
  success: boolean
  supportedLoginTypes: Array<{
    type: string
    name: string
    description: string
    requiredFields: string[]
    optionalFields?: string[]
    supportedProviders?: string[]
  }>
}
```

## 使用方法

### 1. 使用 React Hook

```typescript
import useUnifiedAuth from '@/hooks/use-unified-auth'

function LoginComponent() {
  const { 
    loginWithPassword, 
    loginWithGoogle, 
    isLoading, 
    error 
  } = useUnifiedAuth()

  const handlePasswordLogin = async () => {
    const result = await loginWithPassword('user@example.com', 'password')
    if (result.success) {
      console.log('登入成功:', result.user)
    }
  }

  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle('/dashboard')
    // OAuth 可能會重定向，不一定立即返回結果
  }

  return (
    <div>
      <button onClick={handlePasswordLogin} disabled={isLoading}>
        密碼登入
      </button>
      <button onClick={handleGoogleLogin} disabled={isLoading}>
        Google 登入
      </button>
      {error && <p>錯誤: {error}</p>}
    </div>
  )
}
```

### 2. 使用統一登入組件

```typescript
import { UnifiedLoginForm } from '@/components/auth/UnifiedLoginForm'

function App() {
  const handleLoginSuccess = (user: any) => {
    console.log('用戶登入成功:', user)
    // 重定向到儀表板或更新應用狀態
  }

  const handleLoginError = (error: string) => {
    console.error('登入失敗:', error)
    // 顯示錯誤訊息
  }

  return (
    <UnifiedLoginForm
      onSuccess={handleLoginSuccess}
      onError={handleLoginError}
      redirectTo="/dashboard"
    />
  )
}
```

### 3. 直接調用 API

```typescript
// 密碼登入
const passwordLogin = async (email: string, password: string) => {
  const response = await fetch('/api/auth/unified-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      loginType: 'password',
      email,
      password
    })
  })

  const result = await response.json()
  return result
}

// OAuth 登入
const oauthLogin = async (provider: string) => {
  const response = await fetch('/api/auth/unified-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      loginType: 'oauth',
      provider,
      redirectTo: '/dashboard'
    })
  })

  const result = await response.json()
  return result
}
```

## 安全性考量

### Cookie 安全設定

```typescript
const AUTH_COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,         // 防止 JavaScript 存取
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const, // 防護 CSRF 攻擊
  maxAge: 60 * 60 * 24 * 30,  // 30 天
}
```

### 輸入驗證

- 電子郵件格式驗證
- 密碼強度檢查
- 手機號碼格式驗證
- 防止 SQL 注入和 XSS 攻擊

### 日誌記錄

所有認證事件都會被記錄，包括：
- 登入嘗試
- 登入成功/失敗
- 錯誤和異常
- 安全事件

## 錯誤處理

### 常見錯誤類型

1. **驗證錯誤** (400)
   - 缺少必要欄位
   - 無效的電子郵件格式
   - 密碼太短

2. **認證錯誤** (401)
   - 無效的憑證
   - 帳戶被鎖定
   - OAuth 授權失敗

3. **配置錯誤** (500)
   - Supabase 配置缺失
   - OAuth 提供商配置錯誤

### 錯誤響應格式

```json
{
  "success": false,
  "message": "詳細的錯誤訊息",
  "code": "ERROR_CODE"
}
```

## 測試

### 測試帳號

- **電子郵件**: `testuser@example.com`
- **密碼**: `Abcd_123`

### 測試頁面

訪問 `/test-unified-auth` 頁面來測試統一認證系統的所有功能。

### 單元測試

```typescript
// 測試密碼登入
test('password login success', async () => {
  const result = await loginWithPassword('test@example.com', 'password')
  expect(result.success).toBe(true)
  expect(result.user).toBeDefined()
})

// 測試 OAuth 登入
test('oauth login initiation', async () => {
  const result = await loginWithGoogle('/dashboard')
  // OAuth 會重定向，所以測試重定向邏輯
})
```

## 部署注意事項

### 環境變數

確保以下環境變數已正確設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### OAuth 配置

1. **Google OAuth**:
   - 在 Google Cloud Console 中配置 OAuth 2.0 客戶端
   - 添加正確的重定向 URI
   - 在 Supabase 中配置 Google 提供商

2. **其他 OAuth 提供商**:
   - 按照各提供商的文檔進行配置
   - 確保重定向 URI 正確設定

### 監控和日誌

- 設定日誌聚合服務
- 監控認證失敗率
- 設定安全警報

## 擴展性

### 添加新的認證方式

1. 在 API 端點中添加新的 case
2. 實作對應的處理函數
3. 更新 TypeScript 類型定義
4. 在 UI 組件中添加新的標籤

### 自定義認證邏輯

可以通過修改各個處理函數來自定義認證邏輯，例如：
- 添加多因素認證
- 實作帳戶鎖定機制
- 添加自定義驗證規則

## 故障排除

### 常見問題

1. **OAuth 重定向錯誤**
   - 檢查重定向 URI 配置
   - 確認 OAuth 提供商設定

2. **Cookie 問題**
   - 檢查 HTTPS 設定
   - 確認 SameSite 屬性

3. **CORS 錯誤**
   - 檢查 Supabase CORS 設定
   - 確認域名配置

### 調試工具

- 使用瀏覽器開發者工具檢查網路請求
- 查看伺服器日誌
- 使用 `/test-unified-auth` 頁面進行測試

## 貢獻指南

1. Fork 專案
2. 創建功能分支
3. 添加測試
4. 提交 Pull Request

## 授權

本專案採用 MIT 授權條款。