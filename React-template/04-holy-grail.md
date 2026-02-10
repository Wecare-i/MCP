# 04. Holy Grail (3 Cột)

**Mô tả:** Bố cục kinh điển 3 cột: sidebar trái (navigation), nội dung chính giữa, cột phụ bên phải (info/ads).

**Use cases:** News sites, Documentation, Blogs, Knowledge bases, Content-heavy apps

---

## Tailwind CSS Reference

```html
<!-- Container -->
<div class="grid grid-cols-12 gap-4 min-h-screen">
  <!-- Left Sidebar -->
  <aside class="col-span-3 bg-white p-4">
    <!-- Navigation -->
  </aside>
  <!-- Main Content -->
  <main class="col-span-6 bg-white p-6">
    <!-- Content -->
  </main>
  <!-- Right Sidebar -->
  <aside class="col-span-3 bg-white p-4">
    <!-- Widgets / Ads -->
  </aside>
</div>
```

| Element | Classes |
|---------|---------|
| Grid container | `grid grid-cols-12 gap-4` |
| Left sidebar | `col-span-3` |
| Main content | `col-span-6` |
| Right sidebar | `col-span-3` |

---

## ASCII Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                      │
│ [Logo] Site Name           [Search...]            [Login] [Sign Up]         │
├────────────┬──────────────────────────────────┬────────────────────────────┤
│            │                                    │                            │
│  LEFT      │  MAIN CONTENT                      │  RIGHT                    │
│  SIDEBAR   │  (col-span-6)                      │  SIDEBAR                  │
│ (col-span-3)│                                   │  (col-span-3)             │
│            │  ┌────────────────────────────┐    │                            │
│ Categories │  │ Article Title              │    │  ┌─────────────────┐      │
│ ┌────────┐ │  │ Author • Date              │    │  │ Widget 1        │      │
│ │ Nav 1  │ │  │                            │    │  │ (Related posts) │      │
│ │ Nav 2  │ │  │ Content...                 │    │  └─────────────────┘      │
│ │ Nav 3  │ │  │                            │    │                            │
│ │ Nav 4  │ │  └────────────────────────────┘    │  ┌─────────────────┐      │
│ └────────┘ │                                    │  │ Widget 2        │      │
│            │  ┌────────────────────────────┐    │  │ (Tags/Ads)      │      │
│ Tags       │  │ Comments Section           │    │  └─────────────────┘      │
│ ┌────────┐ │  └────────────────────────────┘    │                            │
│ │ Tag 1  │ │                                    │                            │
│ │ Tag 2  │ │                                    │                            │
│ └────────┘ │                                    │                            │
└────────────┴────────────────────────────────────┴────────────────────────────┘
```

---

## Stitch Prompt

```
Three-column "Holy Grail" layout for [YOUR PURPOSE].
Ví dụ: Portal quản lý kho vật tư / Trang tin tức nội bộ / Knowledge base sản phẩm.

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

Layout: 12-column grid — left sidebar (3), main content (6), right sidebar (3).

Components:
- Header with logo, search, auth buttons
- Left sidebar: navigation categories, tags
- Main content: article/page content, comments
- Right sidebar: widgets, related items, ads
- Footer

Style: Clean, readable, content-focused.
```

---

## Components

| Component | Description |
|-----------|-------------|
| `LeftSidebar` | Navigation, categories |
| `MainContent` | Primary content area |
| `RightSidebar` | Widgets, related info |
| `Header` | Logo, search, auth |
| `Footer` | Site links |

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1024px) | Full 3-column layout |
| Tablet (768-1024px) | Hide right sidebar, 2 columns |
| Mobile (<768px) | Single column, sidebars collapsed |

---

## 🔄 Loop Mode (Multi-Screen)

> Cho content-heavy sites cần nhiều pages (≥3 screens).

| # | Screen | Focus |
|---|--------|-------|
| 1 | Home/Feed | Article list, featured |
| 2 | Article Detail | Full content view |
| 3 | Category Page | Filtered listing |
| 4 | Search Results | Search interface |
