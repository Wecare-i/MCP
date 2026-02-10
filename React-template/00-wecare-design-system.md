# Wecare Design System Reference

> Sử dụng file này làm reference cho tất cả các layout prompts.

---

## Brand Guidelines

### Logo
- **Primary logo:** Sử dụng trên nền sáng/trắng
- **White logo:** Sử dụng trên nền tối hoặc Wecare Blue (#3492ab)
- **Monochrome:** Cho in ấn đơn sắc
- **Logo URL:** https://i.imgur.com/tD07Yrv.png

### Color Palette

| Role | Color Name | Hex Code | Usage |
|------|------------|----------|-------|
| **Primary** | Wecare Blue | `#3492ab` | Primary actions, links, headers |
| **Secondary** | Wecare Green | `#4CAF50` | Positive actions, success, accents |
| **Neutral** | Off White | `#F8F9FA` | Backgrounds |
| **Neutral** | Light Grey | `#E9ECEF` | Borders, disabled states |
| **Neutral** | Medium Grey | `#6C757D` | Subheadings, secondary text |
| **Neutral** | Charcoal | `#343A40` | Main body text |
| **Tint** | Light Wecare Blue | `#7FBACB` | Hover states |
| **Tint** | Pale Wecare Blue | `#C5E0E8` | Backgrounds tints |
| **Shade** | Dark Wecare Blue | `#236E84` | Dark accents |
| **Shade** | Deep Wecare Blue | `#164553` | Footer, dark sections |

### Typography

| Element | Font | Style |
|---------|------|-------|
| Headings | Lexend | Bold, modern, friendly |
| Body Text | Roboto | Clean, professional, readable |

### Component Styling

| Component | Style |
|-----------|-------|
| Button Primary | Wecare Blue (#3492ab) bg, white text |
| Button Positive | Wecare Green (#4CAF50) bg, white text |
| Button Secondary | Transparent bg, Wecare Blue border & text |
| Panel Headers | Wecare Blue (#3492ab) bg, white text |
| Panel Body | Off White (#F8F9FA) bg |

---

## Company Introduction

### Thông tin cơ bản
- **Tên công ty:** CÔNG TY CỔ PHẦN WECARE GROUP
- **Tên quốc tế:** WECARE GROUP JOINT STOCK COMPANY
- **MST:** 4101562154
- **Người đại diện:** Trần Đăng Khôi
- **Ngày thành lập:** 25/09/2020

### Địa chỉ
- **Vietnam:** Lô B39 KCN Phú Tài, Phường Trần Quang Diệu, Bình Định
- **Singapore:** 111 Somerset Road, #0810A, 111 Somerset, Singapore 238164
- **Website:** Wecare.com.vn

### Quick Introduction
> Wecare là nhà phân phối công nghiệp B2B, ứng dụng Dữ liệu và Công nghệ để tối ưu vận hành trong chuỗi cung ứng công nghiệp.

### Vision
> Định hình lại lĩnh vực thu mua công nghiệp và toàn bộ chuỗi cung ứng công nghiệp bằng Data & AI

### Mission
> Góp phần thúc đẩy Việt Nam trở thành một trung tâm sản xuất lớn của thế giới

### Core Values
**Tử tế, Bền bĩ & Đột phá** (Kind, Relentless & Innovative)

### Key Stats (10/2024)
| Metric | Value |
|--------|-------|
| Nhân viên | 100+ |
| Nhóm sản phẩm | 500+ |
| Mã sản phẩm | 15,000+ |
| Khách hàng | 2,000+ |
| Nhà cung cấp | 500+ |

### Sản phẩm chính
- Vật tư Kim khí: bu lông, ốc vít, pát
- Vật tư Điện nước
- Vật tư Bao bì: băng keo, dây đai, dây rút
- Hóa chất: keo apollo, sơn xịt win

### Đối tượng khách hàng
- Cửa hàng: 90% số khách, 70% doanh số
- Nhà máy: 10% số khách, 30% doanh số
- Khu vực: Miền Trung Việt Nam (trung tâm Bình Định)

---

## Stitch Prompt Block

> **Hướng dẫn:** Copy block bên dưới vào **mọi Stitch prompt** để đảm bảo đúng brand.

```
DESIGN SYSTEM (BẮT BUỘC — copy vào mọi prompt):
├─ Brand: Wecare — Nhà phân phối công nghiệp B2B tại Việt Nam
├─ Primary Color: TEAL BLUE #3492ab (KHÔNG dùng purple/indigo)
├─ Accent Color: Green #4CAF50 (success, positive actions)
├─ Background: Off White #F8F9FA
├─ Text: Charcoal #343A40
├─ Borders: Light Grey #E9ECEF
├─ Secondary text: Medium Grey #6C757D
├─ Hover: Light Teal #7FBACB
├─ Dark sections: Deep Teal #164553
├─ Fonts: Lexend (headings, bold), Roboto (body, clean)
├─ Logo: https://i.imgur.com/tD07Yrv.png
├─ Sản phẩm: Kim khí (bu lông, ốc vít, pát), Bao bì (băng keo, dây đai, dây rút), Hóa chất (keo Apollo, sơn xịt), Điện nước
├─ Khách hàng: Cửa hàng vật tư (90%), Nhà máy sản xuất (10%), Miền Trung VN
├─ Buttons: Primary = #3492ab bg + white text, Secondary = transparent + #3492ab border
└─ Ngôn ngữ UI: Tiếng Việt
```

---

## Lưu ý cho Stitch

> [!WARNING]
> Stitch có xu hướng đổi `#3492ab` (teal) thành **purple/indigo**. Để tránh:

1. **Luôn ghi rõ:** "Primary color is TEAL BLUE #3492ab (NOT purple, NOT indigo)"
2. **Nhấn mạnh:** "This is a cyan-teal color, NOT violet"
3. **Kiểm tra** kết quả: nếu Stitch theme hiện `customColor` khác `#3592ac` hoặc `#3492ab` → regenerate
