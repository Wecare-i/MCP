# 08. Grid Layout (Card Grid)

**Mô tả:** Sắp xếp các items có cấu trúc giống nhau thành grid đều đặn, responsive columns.

**Use cases:** Product catalog, Image gallery, Portfolio, Blog posts, User directory

---

## Tailwind CSS Reference

```html
<!-- Grid Container -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-6">
  <!-- Card -->
  <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
    <img class="w-full h-48 object-cover rounded-t-lg" src="..." />
    <div class="p-4">
      <h3 class="font-bold text-lg">Title</h3>
      <p class="text-gray-600 text-sm">Description</p>
      <span class="text-blue-600 font-bold">$99.00</span>
    </div>
  </div>
  <!-- More cards... -->
</div>
```

| Element | Classes |
|---------|---------|
| Grid | `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6` |
| Card | `bg-white rounded-lg shadow hover:shadow-lg transition-shadow` |
| Image | `w-full h-48 object-cover rounded-t-lg` |

---

## ASCII Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                      │
│ [Logo] Product Catalog    [+ Add]  [🔍 Search...]   [Grid ▣] [List ☰]      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FILTERS                                                                    │
│  [All ▼] [Category ▼] [Price ▼]                   Sort: [Newest ▼]         │
│                                                                             │
│  CARD GRID (grid-cols-1 sm:grid-cols-2 md:grid-cols-3)                     │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐                     │
│  │ [  IMAGE    ] │ │ [  IMAGE    ] │ │ [  IMAGE    ] │                     │
│  │ Product A     │ │ Product B     │ │ Product C     │                     │
│  │ Category      │ │ Category      │ │ Category      │                     │
│  │ $99.00        │ │ $149.00       │ │ $49.00        │                     │
│  │ ★★★★☆ (24)    │ │ ★★★★★ (56)    │ │ ★★★☆☆ (12)    │                     │
│  │ [Add to Cart] │ │ [Add to Cart] │ │ [Add to Cart] │                     │
│  └───────────────┘ └───────────────┘ └───────────────┘                     │
│                                                                             │
│  PAGINATION                                                                 │
│  Showing 1-12 of 156                               [< 1 2 3 ... 13 >]      │
└─────────────────────────────────────────────────────────────────────────────┘

── Click card → DETAIL POPUP ──────────────────────────────────────────────────

┌─────────────────────────────────── OVERLAY (bg-black/50) ────────────────────┐
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────┐      │
│    │ POPUP (max-w-2xl, rounded-2xl, shadow-2xl)              [✕]    │      │
│    │                                                                 │      │
│    │  ┌──────────────────────────────────────────────────────┐      │      │
│    │  │                                                      │      │      │
│    │  │              PRODUCT IMAGE                            │      │      │
│    │  │              (w-full, h-64, object-cover)             │      │      │
│    │  │                                                      │      │      │
│    │  └──────────────────────────────────────────────────────┘      │      │
│    │                                                                 │      │
│    │  Product Name                                    $99.00        │      │
│    │  ★★★★☆ (24 reviews)                                            │      │
│    │  ────────────────────────────────────────────────               │      │
│    │  Category: Electronics                                         │      │
│    │                                                                 │      │
│    │  Description text here. Lorem ipsum dolor sit amet,            │      │
│    │  consectetur adipiscing elit...                                 │      │
│    │                                                                 │      │
│    │  ┌──────────────────────┐  ┌──────────────────────┐           │      │
│    │  │   [Add to Cart 🛒]   │  │   [♡ Wishlist]        │           │      │
│    │  └──────────────────────┘  └──────────────────────┘           │      │
│    │                                                                 │      │
│    └─────────────────────────────────────────────────────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Stitch Prompt

```
Grid card layout for [YOUR PURPOSE].

Brand: Wecare Blue (#3492ab), Green (#4CAF50), Off White bg (#F8F9FA).
Fonts: Lexend headings, Roboto body.

Layout: Responsive grid — 1 col mobile, 2 cols tablet, 3 cols desktop.

Components:
- Header with search and view toggle
- Filter bar with dropdowns
- Card grid: image, title, subtitle, price, rating, action button
- Card hover: elevated shadow
- Pagination
- Click card → opens detail popup/modal
- Popup: large image, title, price, rating, description, CTA buttons
- Overlay: bg-black/50, click outside to close

Style: Clean, scannable, equal-height cards.
```

---

## Components

| Component | Description |
|-----------|-------------|
| `CardGrid` | Responsive grid container |
| `ProductCard` | Individual card (click → popup) |
| `DetailPopup` | Modal overlay với product detail |
| `FilterBar` | Filters and sort |
| `Pagination` | Page navigation |
| `Rating` | Star rating display |

## Responsive Behavior

| Breakpoint | Columns |
|------------|---------|
| Desktop (>1024px) | 3-4 columns |
| Tablet (768-1024px) | 2 columns |
| Mobile (<768px) | 1 column |

---

## 🔄 Loop Mode (Multi-Screen)

> Cho catalog/portfolio cần detail pages (≥3 screens).

| # | Screen | Focus |
|---|--------|-------|
| 1 | Grid Listing | Main card grid with filters |
| 2 | Item Detail | Full detail page |
| 3 | Category Browse | Category listing |
