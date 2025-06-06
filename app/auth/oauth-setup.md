# OAuth Setup Instructions

## Google OAuth redirect_uri_mismatch Error Fix

The `redirect_uri_mismatch` error occurs when the redirect URI configured in Google Cloud Console doesn't match what Supabase sends. Here's how to fix it:

### 1. Supabase Dashboard Configuration

Go to your Supabase Dashboard → Authentication → Settings → URL Configuration:

**Site URL:**
- For development: `http://localhost:3000`
- For production: `https://your-vercel-app.vercel.app`

**Redirect URLs (add both):**
- `http://localhost:3000/auth/callback` (for development)
- `https://your-vercel-app.vercel.app/auth/callback` (for production)

### 2. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Click on your OAuth 2.0 Client ID
4. In "Authorized redirect URIs", add:
   - `https://your-supabase-project-ref.supabase.co/auth/v1/callback`
   
   **To find your Supabase project reference:**
   - Go to your Supabase Dashboard
   - Look at the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
   - Or check your `NEXT_PUBLIC_SUPABASE_URL` environment variable

### 3. Environment Variables Check

Make sure these are set in your Vercel deployment:
```
NEXT_PUBLIC_SUPABASE_DATABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Common Issues

- **Domain mismatch**: Make sure the domain in Google Console matches your actual deployed domain
- **HTTP vs HTTPS**: Production should use HTTPS
- **Trailing slashes**: Avoid trailing slashes in redirect URIs
- **Subdomain issues**: If using a custom domain, make sure it's properly configured

### 5. Testing

1. Deploy to Vercel
2. Update the URLs in both Supabase and Google Console with your actual Vercel URL
3. Test the Google OAuth flow

The key is that Google redirects to Supabase's auth endpoint, not directly to your app. Your app's callback route (`/auth/callback`) handles the final step after Supabase processes the OAuth response. 