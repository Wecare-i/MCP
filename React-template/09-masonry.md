# 09. Masonry Layout

**Mô tả:** Tối ưu hóa không gian cho các phần tử có chiều cao không đồng đều, loại bỏ khoảng trắng thừa (phong cách Pinterest).

**Use cases:** Photo gallery, Art portfolio, Design inspiration, Social feed, Blog masonry

---

## Tailwind CSS Reference

```html
<!-- Masonry Container -->
<div class="columns-1 md:columns-3 gap-4 p-6">
  <!-- Item (variable height) -->
  <div class="break-inside-avoid mb-4">
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <img class="w-full" src="..." />
      <div class="p-3">
        <p class="text-sm">Caption</p>
      </div>
    </div>
  </div>
  <!-- More items... -->
</div>
```

| Element | Classes |
|---------|---------|
| Container | `columns-1 md:columns-3 gap-4` |
| Item | `break-inside-avoid mb-4` |
| Card | `bg-white rounded-lg shadow overflow-hidden` |

---

## ASCII Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                      │
│ [Logo] Gallery              [🔍 Search...]  [Filter ▼]  [Upload]           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MASONRY GRID (columns-1 md:columns-3)                                     │
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                                   │
│  │          │ │          │ │ ┌──────┐ │                                   │
│  │  TALL    │ │ SHORT    │ │ │      │ │                                   │
│  │  IMAGE   │ │ IMAGE    │ │ │ MED  │ │                                   │
│  │          │ │ Caption  │ │ │ IMAGE│ │                                   │
│  │          │ └──────────┘ │ │      │ │                                   │
│  │ Caption  │ ┌──────────┐ │ └──────┘ │                                   │
│  └──────────┘ │          │ │ Caption  │                                   │
│  ┌──────────┐ │  MED     │ └──────────┘                                   │
│  │ SHORT    │ │  IMAGE   │ ┌──────────┐                                   │
│  │ IMAGE    │ │          │ │          │                                   │
│  │ Caption  │ │ Caption  │ │  TALL    │                                   │
│  └──────────┘ └──────────┘ │  IMAGE   │                                   │
│  ┌──────────┐ ┌──────────┐ │          │                                   │
│  │  MED     │ │ SHORT    │ │ Caption  │                                   │
│  │  IMAGE   │ │ Caption  │ └──────────┘                                   │
│  └──────────┘ └──────────┘                                                 │
│                                                                             │
│  [Load More]                                                                │
└─────────────────────────────────────────────────────────────────────────────┘

── Click image → LIGHTBOX POPUP ───────────────────────────────────────────────

┌─────────────────────────────────── OVERLAY (bg-black/80) ────────────────────┐
│                                                                             │
│  [← Prev]                                                     [Next →]     │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────┐      │
│    │                                                                 │      │
│    │                                                                 │      │
│    │                    FULL-SIZE IMAGE                               │      │
│    │                    (max-h-[80vh], object-contain)                │      │
│    │                                                                 │      │
│    │                                                                 │      │
│    └─────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────┐      │
│    │ Caption / Title                                         [✕]    │      │
│    │ Author: John Doe  •  Date: 2026-01-15                          │      │
│    │ Tags: #landscape #nature #photography                          │      │
│    │                                                                 │      │
│    │ [♡ Like (234)]  [💬 Comments (12)]  [↗ Share]  [⬇ Download]    │      │
│    └─────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│  Keyboard: ← → to navigate, ESC to close                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Stitch Prompt

```
Masonry grid gallery for [YOUR PURPOSE].
Ví dụ: Showcase nhà cung cấp / Portfolio dự án / Gallery sản phẩm đa kích thước.

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

Layout: CSS columns masonry — 1 col mobile, 2 cols tablet, 3 cols desktop.
Items have variable heights (no equal-height constraint).

Components:
- Header with search, filter, upload button
- Masonry grid with image cards (variable height)
- Each card: image, caption, optional tags
- Hover: overlay with actions (like, share, expand)
- Click image → lightbox popup with full-size view
- Lightbox: prev/next navigation, caption, author, tags, actions
- Keyboard: arrows to navigate, ESC to close
- Load more button or infinite scroll

Style: Pinterest-style, no whitespace gaps, clean.
```

---

## Components

| Component | Description |
|-----------|-------------|
| `MasonryGrid` | CSS columns container |
| `MasonryItem` | break-inside-avoid card |
| `ImageCard` | Image + caption + actions (click → lightbox) |
| `ImageOverlay` | Hover actions overlay |
| `Lightbox` | Full-screen popup: image, caption, nav, actions |
| `LightboxNav` | Prev/Next arrows + keyboard support |

## Responsive Behavior

| Breakpoint | Columns |
|------------|---------|
| Desktop (>1024px) | 3-4 columns |
| Tablet (768-1024px) | 2 columns |
| Mobile (<768px) | 1 column |
