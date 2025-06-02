# 🔑 Kairoria API Keys & Environment Setup

This guide covers all the API keys and environment variables needed for your Kairoria marketplace application.

## 📋 **Required Setup Steps**

### 1. Create `.env.local` file in your project root:

```bash
# Kairoria Marketplace Environment Variables

# === AUTHENTICATION ===
NEXTAUTH_SECRET=your-random-secret-string-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Facebook OAuth  
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# === DATABASE & AUTH ===
# Supabase (recommended - includes database + auth + storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# === EMAIL SERVICE ===
# SendGrid (recommended)
SENDGRID_API_KEY=your_sendgrid_api_key

# === PAYMENT PROCESSING ===
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# === IMAGE STORAGE ===
# Cloudinary (recommended for product images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# === MAPS & LOCATION ===
# Google Maps API
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 🚀 **Priority Order for Setup**

### **Phase 1: Essential (Start Here)**
1. **Database & Auth** - Supabase (free tier: 500MB database + 50MB storage)
2. **Email** - Built into Supabase (or SendGrid for custom templates)
3. **Storage** - Built into Supabase (for product images)

### **Phase 2: Core Features**
4. **Payment** - Stripe (test keys first)
5. **Images** - Cloudinary (free tier: 25k transformations/month)
6. **Maps** - Google Maps API (free tier: $200 credit/month)

### **Phase 3: Enhanced Features**
7. **Social Login** - Google & Facebook OAuth
8. **SMS** - Twilio (optional)
9. **Real-time** - Pusher (optional)

## 📝 **Quick Setup Links**

### **Database & Auth - Supabase**
1. Go to [Supabase](https://supabase.com)
2. Create new project (free tier)
3. Get project URL and anon key from Settings → API
4. Add to `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Get service role key for server-side operations

### **Email - SendGrid**
1. Go to [SendGrid](https://sendgrid.com)
2. Create free account
3. Generate API key
4. Add to `SENDGRID_API_KEY`

### **Payments - Stripe**
1. Go to [Stripe](https://stripe.com)
2. Create account
3. Get test API keys from dashboard
4. Add publishable and secret keys

### **Images - Cloudinary**
1. Go to [Cloudinary](https://cloudinary.com)
2. Create free account
3. Get cloud name and API credentials
4. Add to environment variables

### **Auth Secret**
Generate a random string (32+ characters):
```bash
openssl rand -base64 32
```

## 🔧 **Installation Commands**

After setting up your `.env.local`, install required packages:

```bash
# Supabase (database + auth + storage)
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-ui-react @supabase/auth-ui-shared

# Email
npm install @sendgrid/mail

# Payments
npm install stripe @stripe/stripe-js

# Image handling
npm install cloudinary multer

# Maps (if needed)
npm install @googlemaps/js-api-loader
```

## ⚠️ **Security Notes**

1. **Never commit `.env.local`** to git
2. **Use test keys** during development
3. **Rotate keys** regularly in production
4. **Set up proper CORS** for production domains
5. **Use environment-specific** keys for staging/production

## 🎯 **Minimal Viable Setup**

For a quick start, you only need:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

This will enable:
- ✅ User authentication (social login included)
- ✅ PostgreSQL database storage
- ✅ File storage for product images
- ✅ Real-time updates
- ✅ Row-level security
- ✅ Email notifications (built-in)
- ✅ Basic marketplace functionality

## 🚀 **Deployment Variables**

For production deployment (Vercel/Netlify), add these to your hosting platform:

```bash
NEXTAUTH_URL=https://your-domain.com
NODE_ENV=production
# ... all other variables from above
```

---

**Need help?** Check the individual service documentation or reach out for specific setup assistance! 