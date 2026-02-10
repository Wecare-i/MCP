# 07. Multi-Step Wizard

**Mô tả:** Hiển thị nội dung theo từng bước tuần tự, giúp người dùng hoàn thành quy trình dài không bị ngợp.

**Use cases:** Checkout, Surveys, Registration, Onboarding, Configuration wizards

---

## Tailwind CSS Reference

```html
<!-- Container -->
<div class="min-h-screen bg-gray-50 flex flex-col">
  <!-- Header -->
  <header class="bg-white shadow-sm px-6 py-4">
    <h1>Create Order</h1>
  </header>
  <!-- Stepper -->
  <div class="max-w-2xl mx-auto w-full px-4 py-6">
    <div class="flex items-center justify-between">
      <!-- Step indicators -->
    </div>
  </div>
  <!-- Form Content (centered) -->
  <main class="max-w-2xl mx-auto w-full px-4 flex-grow">
    <!-- Current step form -->
  </main>
  <!-- Navigation Footer -->
  <div class="max-w-2xl mx-auto w-full px-4 py-6 flex justify-between">
    <button class="px-6 py-2 border rounded">← Back</button>
    <button class="px-6 py-2 bg-blue-600 text-white rounded">Continue →</button>
  </div>
</div>
```

| Element | Classes |
|---------|---------|
| Form container | `max-w-2xl mx-auto` (centered, focused) |
| Step content | `flex-grow` |
| Navigation | `flex justify-between` |

---

## ASCII Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ HEADER                                                                      │
│ [Logo] Create New Order                                      [✕ Cancel]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PROGRESS (max-w-2xl mx-auto)                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ●─────────●─────────○─────────○─────────○                          │   │
│  │  1 Info    2 Items   3 Delivery 4 Payment 5 Review                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  FORM CONTENT                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Step 2: Select Products                                             │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ [Search products...]                                                │   │
│  │ ☑ Product A ........................... Qty: [2]   $198.00          │   │
│  │ ☑ Product B ........................... Qty: [1]    $49.00          │   │
│  │ ☐ Product C ........................... Qty: [0]   $199.00          │   │
│  │                                            Subtotal: $247.00        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  NAVIGATION                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [← Back]                                             [Continue →]   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Stitch Prompt

```
Multi-step wizard form for [YOUR PROCESS].
Ví dụ: Wizard tạo đơn đặt hàng vật tư / Onboarding khách hàng B2B / Đăng ký nhà cung cấp.

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

Layout: Centered form (max-w-2xl mx-auto) with progress stepper on top.

Components:
- Progress bar: step numbers + labels (completed ●, current ●, pending ○)
- Form content: current step fields
- Navigation: Back / Continue buttons
- Step validation per step

Steps: [1. Info → 2. Items → 3. Delivery → 4. Payment → 5. Review]

Style: Clean, focused, minimal distractions.
```

---

## Components

| Component | Description |
|-----------|-------------|
| `ProgressStepper` | Step indicator |
| `WizardStep` | Individual step content |
| `FormField` | Input with label + validation |
| `NavigationFooter` | Back/Next buttons |
| `ReviewSummary` | Final step summary |

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1024px) | Centered 600-800px, horizontal stepper |
| Tablet (768-1024px) | Full width with padding |
| Mobile (<768px) | Full width, compact/vertical stepper |
