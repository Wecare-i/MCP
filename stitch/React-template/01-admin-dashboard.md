# 01. Admin Dashboard

**Mô tả:** Bố cục quản trị với sidebar cố định bên trái và content area bên phải cuộn độc lập.

**Use cases:** Admin Systems, CRM, CMS, SaaS dashboards, Analytics panels

---

## Tailwind CSS Reference

```html
<!-- Container -->
<div class="flex h-screen overflow-hidden">
  <!-- Sidebar -->
  <aside class="w-64 flex-shrink-0 bg-gray-900 text-white overflow-y-auto">
    <!-- Nav items -->
  </aside>
  <!-- Main Content -->
  <main class="flex-1 overflow-y-auto bg-gray-50 p-6">
    <!-- Page content -->
  </main>
</div>
```

| Element | Classes |
|---------|---------|
| Container | `flex h-screen overflow-hidden` |
| Sidebar | `w-64 flex-shrink-0 overflow-y-auto` |
| Main Content | `flex-1 overflow-y-auto` |

---

## ASCII Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER (optional)                                                           │
│ [Logo] Dashboard           [Search...]    [🔔] [👤 User ▼]                 │
├────────────┬────────────────────────────────────────────────────────────────┤
│            │                                                                │
│  SIDEBAR   │  MAIN CONTENT                                                  │
│  (w-64)    │                                                                │
│            │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ [Dashboard]│  │ STAT 1   │ │ STAT 2   │ │ STAT 3   │ │ STAT 4   │          │
│ [Orders]   │  │ 1,234    │ │ $45,678  │ │ 89%      │ │ 56       │          │
│ [Products] │  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│ [Reports]  │                                                                │
│ [Settings] │  ┌─────────────────────────────┐ ┌────────────────────┐       │
│            │  │  CHART AREA                 │ │ PIE/DONUT          │       │
│            │  └─────────────────────────────┘ └────────────────────┘       │
│            │                                                                │
│            │  ┌─────────────────────────────────────────────────────┐      │
│            │  │ DATA TABLE / RECENT ACTIVITY                        │      │
│            │  └─────────────────────────────────────────────────────┘      │
└────────────┴────────────────────────────────────────────────────────────────┘
```

---

## Stitch Prompt

```
Analytics dashboard for [YOUR PURPOSE].

Brand: Wecare Blue (#3492ab), Green (#4CAF50), Off White background.
Fonts: Lexend headings, Roboto body.
Logo: https://i.imgur.com/tD07Yrv.png

Layout: Dark sidebar (w-64, fixed) + light main content (flex-1, scrollable).

Components:
- 4 stat cards with trend indicators
- Line/bar chart + pie chart
- Data table with recent activity

Style: Professional B2B industrial, spacious, modern.
```

---

## Components

| Component | Description |
|-----------|-------------|
| `Sidebar` | Collapsible navigation with icons |
| `StatCard` | Metric widget với trend indicator |
| `Charts` | Line, Bar, Pie charts |
| `DataTable` | Paginated table |
| `Header` | Search, notifications, user menu |

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1024px) | Full sidebar, 4-column stats |
| Tablet (768-1024px) | Collapsed sidebar (icons only), 2-column stats |
| Mobile (<768px) | Hidden sidebar (hamburger), 1-column |

---

## 🔄 Loop Mode (Multi-Screen)

> Sử dụng khi cần build app hoàn chỉnh với nhiều pages từ sidebar (≥3 screens).

| # | Screen | Focus |
|---|--------|-------|
| 1 | Dashboard | Stats, charts (trang này) |
| 2 | Orders List | CRUD Table |
| 3 | Order Detail | Timeline, line items |
| 4 | Products | Card Grid/Table |
| 5 | Reports | Analytics, filters |
| 6 | Settings | Profile, preferences |
