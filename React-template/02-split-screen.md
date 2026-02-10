# 03. Split Screen

**Mô tả:** Màn hình chia đôi — hai panel song song để đối chiếu, so sánh hoặc hiển thị thông tin song song.

**Use cases:** Đối chiếu công nợ, Login/Register, So sánh sản phẩm, Before/After, Data matching

---

## Tailwind CSS Reference

```html
<!-- Container -->
<div class="flex h-screen w-full">
  <!-- Left Panel -->
  <div class="w-1/2 border-r overflow-y-auto p-6">
    <!-- Left content -->
  </div>
  <!-- Right Panel -->
  <div class="w-full lg:w-1/2 overflow-y-auto p-6">
    <!-- Right content -->
  </div>
</div>
```

| Element | Classes |
|---------|---------|
| Container | `flex h-screen w-full` |
| Left panel | `w-1/2 border-r overflow-y-auto` |
| Right panel | `w-full lg:w-1/2 overflow-y-auto` |

---

## ASCII Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                      │
│ [Logo] [Title]               [FilterDropdown]     [ActionBtn] [👤 UserMenu]│
├────────────────────────────────────┬────────────────────────────────────────┤
│                                    │                                        │
│  LEFT PANEL (w-1/2)                │  RIGHT PANEL (w-1/2)                  │
│  [PanelHeader]                     │  [PanelHeader]                        │
│                                    │                                        │
│  [SelectorDropdown]          ▼     │  [SelectorDropdown]              ▼    │
│  ──────────────────────────────    │  ──────────────────────────────────   │
│  ┌──────────────────────────────┐  │  ┌──────────────────────────────────┐ │
│  │ [DataTable]                  │  │  │ [DataTable]                      │ │
│  │ Col A | Col B | Col C | [St]│  │  │ Col A | Col B | Col C | [Status]│ │
│  │───────|───────|───────|─────│  │  │───────|───────|───────|─────────│ │
│  │ Row 1 ................. [✅]│  │  │ Row 1 ................. [✅]     │ │
│  │ Row 2 ................. [✅]│  │  │ Row 2 ................. [✅]     │ │
│  │ Row 3 ................. [⚠️]│  │  │ Row 3 ................. [⚠️]     │ │
│  │ Row 4 ................. [❌]│  │  │ Row 4 ................. [❌]     │ │
│  └──────────────────────────────┘  │  └──────────────────────────────────┘ │
│                                    │                                        │
│  [SummaryInfo]                     │  [SummaryInfo]                        │
│                                    │                                        │
├────────────────────────────────────┴────────────────────────────────────────┤
│  [SummaryBar]                                                               │
│  [DiffIndicator] Chênh lệch / Kết quả so sánh          [ActionButton]      │
│  [StatusBadge] [StatusBadge] [StatusBadge]                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Stitch Prompt

```
Split screen layout for [YOUR PURPOSE].
Ví dụ: Đối chiếu công nợ nhà cung cấp / So sánh đơn hàng / Data matching vật tư.

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

Layout: Split screen 50/50 — Left panel [SOURCE A], Right panel [SOURCE B].

Components:
- Header: logo, title, FilterDropdown, ActionBtn, UserMenu
- LeftPanel + RightPanel: same structure, different data source
- SelectorDropdown: choose entity to compare
- DataTable: rows with StatusIndicator per row
- SummaryInfo: totals per panel
- SummaryBar: overall diff/result across both panels
- StatusIndicator: ✅ match, ⚠️ mismatch, ❌ missing
- On mobile: stack vertical (left on top, right below)

Style: Data-focused, clean, clear status indicators.
```

---

## Components

| Component | Description |
|-----------|-------------|
| `SplitContainer` | Full-screen flex container hai panel |
| `LeftPanel` | Panel bên trái (source A) |
| `RightPanel` | Panel bên phải (source B) |
| `PanelHeader` | Tiêu đề mỗi panel |
| `SelectorDropdown` | Chọn entity để đối chiếu |
| `DataTable` | Bảng dữ liệu với status mỗi row |
| `StatusIndicator` | ✅ khớp / ⚠️ lệch / ❌ thiếu |
| `SummaryInfo` | Tổng hợp mỗi panel |
| `SummaryBar` | Thanh tổng hợp chênh lệch |
| `DiffIndicator` | Hiển thị kết quả so sánh |
| `ActionButton` | Nút hành động (xác nhận, export) |

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1024px) | Side-by-side 50/50 |
| Tablet (768-1024px) | Left 45%, Right 55% |
| Mobile (<768px) | Stacked vertical (left trên, right dưới) |
