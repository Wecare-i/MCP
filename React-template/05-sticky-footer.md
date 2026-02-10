# 05. Sticky Footer

**Mô tả:** Đảm bảo footer luôn nằm dưới cùng màn hình, kể cả khi nội dung trang quá ngắn.

**Use cases:** Landing pages, Marketing pages, Single-page info, Company websites

---

## Tailwind CSS Reference

```html
<!-- Container -->
<div class="flex flex-col min-h-screen">
  <!-- Header -->
  <header class="sticky top-0 z-50 bg-white shadow-sm">
    <!-- Navbar -->
  </header>
  <!-- Main Content (pushes footer down) -->
  <main class="flex-grow">
    <!-- Page sections -->
  </main>
  <!-- Footer (always at bottom) -->
  <footer class="bg-gray-900 text-white py-12">
    <!-- Footer content -->
  </footer>
</div>
```

| Element | Classes |
|---------|---------|
| Container | `flex flex-col min-h-screen` |
| Main | `flex-grow` |
| Footer | Stays at bottom automatically |

---

## ASCII Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NAVBAR (sticky top-0)                                                       │
│ [Logo]     [Features] [Pricing] [About]              [Login] [Sign Up]      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  HERO SECTION                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │   Headline + Subtext + CTA Buttons + Hero Image                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  FEATURES                                                                   │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                     │
│  │ Feature 1     │ │ Feature 2     │ │ Feature 3     │                     │
│  └───────────────┘ └───────────────┘ └───────────────┘                     │
│                                                                             │
│  CTA SECTION                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Ready to get started? [Start Free]                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  flex-grow pushes footer to bottom ↓                                        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ FOOTER (always at bottom)                                                   │
│ [Logo]  Product | Company | Resources | Legal       [Social Icons]          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Stitch Prompt

```
Landing page with sticky footer for [YOUR PURPOSE].
Ví dụ: Trang giới thiệu Wecare / Landing page B2B / Trang tuyển dụng.

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

Layout: flex-col min-h-screen — navbar (sticky), content (flex-grow), footer (always bottom).

Sections:
- Sticky navbar with logo, links, CTA buttons
- Hero section with headline, subtext, CTA
- Features grid (3 cards)
- Final CTA section
- Dark footer with links and social icons

Style: Modern, clean, marketing-focused.
```

---

## Components

| Component | Description |
|-----------|-------------|
| `Navbar` | Sticky top navigation |
| `Hero` | Hero section with CTA |
| `FeatureGrid` | Feature cards |
| `CTASection` | Call to action |
| `Footer` | Always-at-bottom footer |

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1024px) | Full horizontal layout |
| Tablet (768-1024px) | Stacked sections |
| Mobile (<768px) | Single column, hamburger menu |
