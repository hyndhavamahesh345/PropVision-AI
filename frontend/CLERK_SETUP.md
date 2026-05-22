# Clerk Authentication Setup Guide

This project uses [Clerk](https://clerk.com) for authentication. Follow these steps to complete the setup.

## 🚀 Quick Setup

### 1. Create a Clerk Account
1. Go to [clerk.com](https://clerk.com) and sign up
2. Create a new application
3. Choose your authentication methods (Email, Google, GitHub, etc.)

### 2. Get Your API Keys
1. In your Clerk dashboard, go to **API Keys**
2. Copy your **Publishable Key** and **Secret Key**

### 3. Update Environment Variables

Update your `.env.local` file with your actual Clerk keys:

```env
# Replace with your actual keys from Clerk dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_actual_key_here
CLERK_SECRET_KEY=sk_test_your_actual_secret_key_here

# These are already configured
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### 4. Configure Allowed Redirect URLs

In your Clerk dashboard, add these URLs to your allowed redirects:

**For Development:**
- `http://localhost:3000`
- `http://localhost:3000/sign-in`
- `http://localhost:3000/sign-up`

**For Production (Vercel):**
- `https://your-domain.vercel.app`
- `https://your-domain.vercel.app/sign-in`
- `https://your-domain.vercel.app/sign-up`

### 5. Add Environment Variables to Vercel

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add the following variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`

## 📁 What's Been Configured

### ✅ Files Created/Updated:

1. **`src/middleware.ts`** - Route protection middleware
2. **`src/app/sign-in/[[...sign-in]]/page.tsx`** - Sign in page
3. **`src/app/sign-up/[[...sign-up]]/page.tsx`** - Sign up page
4. **`src/app/layout.tsx`** - ClerkProvider with custom theme
5. **`src/components/layout/Navbar.tsx`** - UserButton integration

### 🔒 Protected Routes

All routes are protected by default except:
- `/sign-in`
- `/sign-up`
- `/api/webhooks`

Users must be authenticated to access the dashboard and other pages.

## 🎨 Customization

The Clerk components are styled to match your app's dark theme with:
- Indigo gradient buttons
- Glass morphism effects
- Dark background with subtle borders
- Custom color scheme matching your design system

## 🧪 Testing

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`
3. You should be redirected to `/sign-in`
4. Create a test account or sign in
5. After authentication, you'll be redirected to the dashboard

## 📚 Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Integration Guide](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Components](https://clerk.com/docs/components/overview)
- [Customization Options](https://clerk.com/docs/components/customization/overview)

## 🔧 Troubleshooting

### Issue: "Clerk: Missing publishable key"
**Solution:** Make sure your `.env.local` file has the correct `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

### Issue: Redirect loop
**Solution:** Check that your redirect URLs in Clerk dashboard match your app URLs

### Issue: Styling issues
**Solution:** The custom theme is configured in `src/app/layout.tsx` - adjust the appearance object as needed

## 🚀 Next Steps

1. Configure your preferred authentication methods in Clerk dashboard
2. Customize the sign-in/sign-up pages if needed
3. Add user metadata or custom fields
4. Set up webhooks for user events (optional)
5. Configure email templates in Clerk dashboard
