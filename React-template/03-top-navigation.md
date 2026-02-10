# 02. Top Navigation

**Mô tả:** Bố cục với thanh điều hướng nằm trên cùng, ưu tiên không gian chiều ngang rộng rãi cho nội dung.

**Use cases:** E-commerce, Product websites, Corporate sites, Portfolios, Documentation

---

## Tailwind CSS Reference

```html
<!-- Navbar -->
<nav class="sticky top-0 z-50 bg-white shadow-sm">
  <div class="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
    <!-- Logo + Nav Links + Actions -->
  </div>
</nav>
<!-- Content -->
<main class="max-w-7xl mx-auto px-4 py-8">
  <!-- Page content -->
</main>
```

| Element | Classes |
|---------|---------|
| Navbar | `sticky top-0 z-50` |
| Nav container | `max-w-7xl mx-auto px-4 flex items-center justify-between h-16` |
| Content | `max-w-7xl mx-auto px-4 py-8` |

---

## ASCII Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR (sticky top-0 z-50)                                                  │
│ [Logo]    [Home] [Products] [About] [Contact]    [Search] [Cart] [Login]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MAIN CONTENT (max-w-7xl mx-auto)                                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ HERO / BANNER                                                       │   │
│  │ Headline text + CTA buttons                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐   │
│  │ Feature 1     │ │ Feature 2     │ │ Feature 3     │ │ Feature 4     │   │
│  └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ CONTENT SECTION                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  FOOTER                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Stitch Prompt

```
Website with top navigation bar for [YOUR PURPOSE].
Ví dụ: Trang danh mục vật tư công nghiệp / Website giới thiệu Wecare / Portal B2B.

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

Layout: Sticky top navbar + centered content area (max-w-7xl).

Components:
- Sticky navbar with logo, nav links, search, user actions
- Hero/banner section
- Feature cards grid
- Content sections
- Footer

Style: Clean, modern, wide horizontal space.
```

---

## Components

| Component | Description |
|-----------|-------------|
| `Navbar` | Sticky top navigation |
| `NavLink` | Navigation link with hover state |
| `Hero` | Banner/hero section |
| `ContentSection` | Reusable content block |
| `Footer` | Site footer |

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1024px) | Full horizontal nav links |
| Tablet (768-1024px) | Condensed nav |
| Mobile (<768px) | Hamburger menu |

---

## 🔄 Loop Mode (Multi-Screen)

> Phù hợp cho website nhiều trang dưới cùng navbar (≥3 screens).

| # | Screen | Focus |
|---|--------|-------|
| 1 | Home | Hero, features overview |
| 2 | Products/Services | Grid listing |
| 3 | About | Company info |
| 4 | Contact | Contact form |
