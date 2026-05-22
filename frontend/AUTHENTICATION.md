# 🔐 Authentication System Overview

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Clerk Authentication                     │
│                    (clerk.com dashboard)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ API Keys
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Next.js Application                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              ClerkProvider (layout.tsx)            │    │
│  │         • Dark theme configuration                 │    │
│  │         • Custom styling                           │    │
│  │         • Global auth context                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Middleware (middleware.ts)               │    │
│  │         • Route protection                         │    │
│  │         • Redirect unauthenticated users           │    │
│  │         • Public route matching                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Sign In    │  │  Sign Up    │  │  Dashboard  │        │
│  │  /sign-in   │  │  /sign-up   │  │  / (home)   │        │
│  │  [Public]   │  │  [Public]   │  │  [Protected]│        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Navbar (UserButton)                   │    │
│  │         • User profile                             │    │
│  │         • Settings                                 │    │
│  │         • Sign out                                 │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

## User Journey

### 1️⃣ First Visit (Unauthenticated)
```
User visits app → Middleware checks auth → Redirects to /sign-in
```

### 2️⃣ Sign Up Flow
```
/sign-in → Click "Sign up" → /sign-up → Create account → Redirect to /
```

### 3️⃣ Sign In Flow
```
/sign-in → Enter credentials → Authenticate → Redirect to /
```

### 4️⃣ Authenticated Session
```
User navigates app → Middleware allows access → UserButton in navbar
```

### 5️⃣ Sign Out
```
Click UserButton → Sign out → Redirect to /sign-in
```

## File Structure

```
frontend/
├── src/
│   ├── middleware.ts                          # 🛡️ Route protection
│   ├── app/
│   │   ├── layout.tsx                         # 🎨 ClerkProvider + theme
│   │   ├── sign-in/
│   │   │   └── [[...sign-in]]/
│   │   │       └── page.tsx                   # 🔑 Sign-in page
│   │   ├── sign-up/
│   │   │   └── [[...sign-up]]/
│   │   │       └── page.tsx                   # ✍️ Sign-up page
│   │   └── page.tsx                           # 🏠 Protected dashboard
│   └── components/
│       ├── auth/
│       │   └── ProtectedRoute.tsx             # 🔒 Optional wrapper
│       └── layout/
│           └── Navbar.tsx                     # 👤 UserButton integration
├── .env.local                                 # 🔐 Environment variables
├── .env.example                               # 📝 Template
├── CLERK_SETUP.md                             # 📚 Setup guide
└── AUTHENTICATION.md                          # 📖 This file
```

## Environment Variables

### Required Variables
```env
# Clerk API Keys (get from clerk.com dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk URLs (already configured)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### Where to Add Them

**Local Development:**
- File: `frontend/.env.local`
- Already created, just update the keys

**Production (Vercel):**
- Dashboard: Project Settings → Environment Variables
- Add all 6 variables above

## Protected vs Public Routes

### 🔓 Public Routes (No Auth Required)
- `/sign-in` - Sign in page
- `/sign-up` - Sign up page
- `/api/webhooks/*` - Webhook endpoints

### 🔒 Protected Routes (Auth Required)
- `/` - Dashboard
- `/upload` - Upload page
- `/inspections/*` - Inspection pages
- `/inventory/*` - Inventory pages
- All other routes

### How to Add Public Routes

Edit `src/middleware.ts`:
```typescript
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/your-new-public-route(.*)', // Add here
]);
```

## Components

### ClerkProvider (layout.tsx)
Wraps entire app, provides auth context globally.

**Features:**
- Dark theme
- Custom colors (indigo primary)
- Glass morphism styling
- Gradient buttons

### UserButton (Navbar.tsx)
Displays user avatar with dropdown menu.

**Features:**
- Profile management
- Settings access
- Sign out
- Custom styling

### SignIn & SignUp Pages
Custom styled authentication pages.

**Features:**
- Match app design
- Dark theme
- Glass effects
- Responsive

### ProtectedRoute Component (Optional)
Client-side protection wrapper.

**Usage:**
```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

## Clerk Hooks (Available in Components)

### useAuth()
```tsx
import { useAuth } from '@clerk/nextjs';

const { userId, isLoaded, isSignedIn } = useAuth();
```

### useUser()
```tsx
import { useUser } from '@clerk/nextjs';

const { user, isLoaded } = useUser();
// Access: user.firstName, user.email, etc.
```

### useClerk()
```tsx
import { useClerk } from '@clerk/nextjs';

const { signOut, openSignIn } = useClerk();
```

## Customization Examples

### Change Primary Color
Edit `src/app/layout.tsx`:
```typescript
variables: {
  colorPrimary: "#10b981", // Green instead of indigo
}
```

### Add Social Login
In Clerk dashboard:
1. Go to User & Authentication → Social Connections
2. Enable Google, GitHub, etc.
3. Configure OAuth credentials

### Custom User Fields
In Clerk dashboard:
1. Go to User & Authentication → User Metadata
2. Add custom fields
3. Access via `user.publicMetadata` or `user.privateMetadata`

### Email Templates
In Clerk dashboard:
1. Go to Customization → Emails
2. Customize verification, welcome, etc.

## Security Best Practices

✅ **DO:**
- Use environment variables for keys
- Keep secret key private
- Use test keys in development
- Use production keys in production
- Enable MFA in Clerk dashboard
- Configure session timeout

❌ **DON'T:**
- Commit `.env.local` to git
- Share secret keys
- Use production keys in development
- Disable HTTPS in production

## Testing

### Local Testing
```bash
cd frontend
npm run dev
```

1. Visit `http://localhost:3000`
2. Should redirect to `/sign-in`
3. Create test account
4. Verify redirect to dashboard
5. Test UserButton functionality
6. Test sign out

### Production Testing
1. Deploy to Vercel
2. Add environment variables
3. Test sign-up flow
4. Test sign-in flow
5. Test protected routes
6. Test sign-out

## Troubleshooting

### Issue: "Clerk: Missing publishable key"
**Cause:** Environment variable not set
**Fix:** Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to `.env.local`

### Issue: Infinite redirect loop
**Cause:** Middleware configuration issue
**Fix:** Check `isPublicRoute` matcher in `middleware.ts`

### Issue: Styling doesn't match
**Cause:** Theme not applied
**Fix:** Check `appearance` config in `layout.tsx`

### Issue: Can't sign in
**Cause:** Wrong API keys or domain mismatch
**Fix:** Verify keys in Clerk dashboard and check allowed domains

### Issue: UserButton not showing
**Cause:** Not authenticated or import issue
**Fix:** Check authentication status and import statement

## Resources

- 📚 [Clerk Documentation](https://clerk.com/docs)
- 🚀 [Next.js Integration](https://clerk.com/docs/quickstarts/nextjs)
- 🎨 [Customization Guide](https://clerk.com/docs/components/customization/overview)
- 🔧 [API Reference](https://clerk.com/docs/references/nextjs/overview)
- 💬 [Clerk Discord](https://clerk.com/discord)

## Support

Need help? Check these resources:
1. **CLERK_SETUP.md** - Detailed setup instructions
2. **Clerk Dashboard** - Real-time logs and debugging
3. **Clerk Documentation** - Comprehensive guides
4. **Clerk Discord** - Community support

---

**Status:** ✅ Fully Integrated and Ready to Use

**Next Step:** Get your API keys from [clerk.com](https://clerk.com) and update `.env.local`
