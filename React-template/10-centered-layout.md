# 10. Centered Layout

**Mô tả:** Tập trung sự chú ý vào một thẻ nội dung duy nhất căn giữa màn hình.

**Use cases:** Sign In, Sign Up, 404 Not Found, Error pages, Maintenance, Coming soon, Confirmation

---

## Tailwind CSS Reference

```html
<!-- Full-screen centered container -->
<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <!-- Centered card -->
  <div class="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
    <div class="text-center">
      <h1 class="text-2xl font-bold">404</h1>
      <p class="text-gray-600 mt-2">Page not found</p>
      <button class="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg">
        Go Home
      </button>
    </div>
  </div>
</div>
```

| Element | Classes |
|---------|---------|
| Container | `min-h-screen flex items-center justify-center` |
| Card | `max-w-md w-full bg-white rounded-2xl shadow-lg p-8` |
| Content | `text-center` |

---

## ASCII Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         (bg-gray-50 / gradient)                             │
│                                                                             │
│                                                                             │
│                      ┌────────────────────────────┐                        │
│                      │    (max-w-md, shadow-lg)    │                        │
│                      │                            │                        │
│                      │         [Logo]              │                        │
│                      │                            │                        │
│                      │      Sign In               │                        │
│                      │      Welcome back!          │                        │
│                      │                            │                        │
│                      │   [Email           ]       │                        │
│                      │   [Password        ] [👁]  │                        │
│                      │                            │                        │
│                      │   ☑ Remember me             │                        │
│                      │   [Forgot password?]        │                        │
│                      │                            │                        │
│                      │   [      Sign In      ]     │                        │
│                      │                            │                        │
│                      │   ─── Or continue with ─── │                        │
│                      │   [Google] [Microsoft]      │                        │
│                      │                            │                        │
│                      │   Don't have account?       │                        │
│                      │   [Create account]          │                        │
│                      │                            │                        │
│                      └────────────────────────────┘                        │
│                                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Stitch Prompt

```
Centered sign-in page for [YOUR APP].

Brand: Wecare Blue (#3492ab), Off White bg (#F8F9FA).
Fonts: Lexend headings, Roboto body.
Logo: https://i.imgur.com/tD07Yrv.png

Layout: Full-screen centered — single card (max-w-md) in the middle.

Components:
- Centered card with shadow on subtle bg
- Logo on top
- Title "Sign In" + subtitle "Welcome back!"
- Email + Password fields (password with show/hide toggle)
- Remember me checkbox + Forgot password link
- Primary Sign In button (full width)
- Social login divider: Google, Microsoft
- "Don't have account? Create account" link

Style: Minimal, focused, trustworthy, modern.
```

---

## Components

| Component | Description |
|-----------|-------------|
| `CenteredContainer` | Full-screen flex centering |
| `ContentCard` | max-w-md centered card |
| `LoginForm` | Email, password, remember me, submit |
| `SocialLogin` | OAuth buttons (Google, Microsoft) |
| `FormLinks` | Forgot password, create account |

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1024px) | Card centered, max-w-md |
| Tablet (768-1024px) | Card centered, same |
| Mobile (<768px) | Card full-width with padding |
