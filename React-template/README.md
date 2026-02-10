# Stitch React Templates

> 10 mẫu bố cục web chuẩn cho Stitch MCP, đồng bộ từ NotebookLM.

## Templates

| # | Tên | Use Cases | Loop Mode |
|---|-----|-----------|:---------:|
| 01 | [Admin Dashboard](01-admin-dashboard.md) | Admin, CRM, SaaS | ✅ |
| 02 | [Top Navigation](02-top-navigation.md) | E-commerce, Corporate | ✅ |
| 03 | [Split Screen](03-split-screen.md) | Login, Register | ❌ |
| 04 | [Holy Grail](04-holy-grail.md) | News, Docs, Blog | ✅ |
| 05 | [Sticky Footer](05-sticky-footer.md) | Landing page, Info | ❌ |
| 06 | [Mobile Bottom Nav](06-mobile-bottom-nav.md) | Mobile app, PWA | ✅ |
| 07 | [Multi-Step Wizard](07-multi-step-wizard.md) | Checkout, Survey | ❌ |
| 08 | [Grid Layout](08-grid-layout.md) | Catalog, Portfolio | ✅ |
| 09 | [Masonry](09-masonry.md) | Gallery, Pinterest | ❌ |
| 10 | [Centered Layout](10-centered-layout.md) | 404, Error, Simple Login | ❌ |

## Cách sử dụng

1. **Chọn template** phù hợp với app cần build
2. **Copy Stitch Prompt** → sửa `[YOUR PURPOSE]` thành mô tả thực tế
3. Generate screen trong Stitch MCP

## Stitch-Loop Rule

> ≥3 màn hình → dùng **stitch-loop** để tạo liên tiếp với sidebar/nav nhất quán.

Chỉ templates có Loop Mode ✅ mới phù hợp cho multi-screen gen.

## Design System

Xem [00-wecare-design-system.md](00-wecare-design-system.md) cho brand colors, fonts, logo.
