# 06. Mobile Bottom Navigation

**Mô tả:** Thanh điều hướng cố định ở cạnh dưới màn hình, tối ưu cho thao tác bằng ngón cái trên mobile.

**Use cases:** Mobile-first web apps, PWA, Social apps, Consumer apps

---

## Tailwind CSS Reference

```html
<!-- Container -->
<div class="min-h-screen pb-16">
  <!-- Header -->
  <header class="sticky top-0 z-40 bg-white shadow-sm px-4 py-3">
    <h1 class="text-lg font-bold">App Name</h1>
  </header>
  <!-- Content -->
  <main class="px-4 py-4">
    <!-- Page content -->
  </main>
  <!-- Bottom Navigation Bar -->
  <nav class="fixed bottom-0 w-full h-16 z-50 bg-white border-t flex items-center justify-around">
    <a class="flex flex-col items-center text-xs text-blue-600">
      <span>🏠</span> Home
    </a>
    <a class="flex flex-col items-center text-xs text-gray-500">
      <span>🔍</span> Search
    </a>
    <a class="flex flex-col items-center text-xs text-gray-500">
      <span>➕</span> Add
    </a>
    <a class="flex flex-col items-center text-xs text-gray-500">
      <span>🔔</span> Alerts
    </a>
    <a class="flex flex-col items-center text-xs text-gray-500">
      <span>👤</span> Profile
    </a>
  </nav>
</div>
```

| Element | Classes |
|---------|---------|
| Content padding | `pb-16` (avoid bottom bar overlap) |
| Bottom bar | `fixed bottom-0 w-full h-16 z-50` |
| Nav items | `flex flex-col items-center text-xs` |

---

## ASCII Layout

```
┌────────────────────────────┐
│ HEADER                     │
│ App Name           [⚙️]    │
├────────────────────────────┤
│                            │
│  CONTENT AREA              │
│  (scrollable, pb-16)       │
│                            │
│  ┌──────────────────────┐  │
│  │ Card 1               │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ Card 2               │  │
│  └──────────────────────┘  │
│  ┌──────────────────────┐  │
│  │ Card 3               │  │
│  └──────────────────────┘  │
│                            │
├────────────────────────────┤
│ BOTTOM NAV (fixed h-16)   │
│ 🏠    🔍    ➕    🔔    👤  │
│ Home Search Add  Alert Pro │
└────────────────────────────┘
```

---

## Stitch Prompt

```
Mobile app with bottom navigation bar for [YOUR PURPOSE].
Ví dụ: App kiểm kho di động / App đặt hàng vật tư / App nhân viên sales.

DESIGN SYSTEM (BẮT BUỘC):
├─ Brand: Wecare — Nhà phân phối công nghiệp B2B tại Việt Nam
├─ Primary Color: TEAL BLUE #3492ab (KHÔNG dùng purple/indigo)
├─ Accent Color: Green #4CAF50 (success, positive actions)
├─ Background: Off White #F8F9FA | Text: Charcoal #343A40
├─ Fonts: Lexend (headings), Roboto (body)
├─ Logo: https://i.imgur.com/tD07Yrv.png
├─ Sản phẩm: Kim khí (bu lông, ốc vít), Bao bì (băng keo, dây đai), Hóa chất (keo, sơn), Điện nước
├─ Khách hàng: Cửa hàng vật tư (90%), Nhà máy (10%), Miền Trung VN
└─ Ngôn ngữ UI: Tiếng Việt

Layout: Mobile-first — header top, content scrollable, fixed bottom nav bar (h-16).
Device: MOBILE viewport.

Components:
- Simple header with title
- Scrollable content area with cards
- Fixed bottom navigation: Home, Search, Add, Alerts, Profile
- Active tab highlighted with primary color

Style: Clean, thumb-friendly, iOS/Android native feel.
```

---

## Components

| Component | Description |
|-----------|-------------|
| `BottomNav` | Fixed bottom navigation bar |
| `NavTab` | Individual tab with icon + label |
| `Header` | Simple top header |
| `ContentArea` | Scrollable content with bottom padding |

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | **Primary layout** — bottom nav |
| Tablet (768-1024px) | Optional: switch to sidebar |
| Desktop (>1024px) | Switch to sidebar or top nav |

---

## 🔄 Loop Mode (Multi-Screen)

> Mỗi tab trong bottom nav = 1 screen riêng (≥3 screens).

| # | Screen | Focus |
|---|--------|-------|
| 1 | Home | Feed, overview |
| 2 | Search | Search + results |
| 3 | Create/Add | Form tạo mới |
| 4 | Notifications | Alert list |
| 5 | Profile | User profile, settings |
