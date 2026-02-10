---
description: Tạo app/màn hình mới với Stitch MCP (hỗ trợ Stitch-Loop cho multi-screen)
---

## Khi nhận yêu cầu tạo app/màn hình:

### Step 1: Phân tích & Quyết định Mode

| Số screens | Mode | Action |
|------------|------|--------|
| 1-2 | Single Screen | Tạo prompt chi tiết, gen trực tiếp |
| **>= 3** | **Stitch Loop** | Setup files → Loop generate |

---

## PATH A: Single Screen (1-2 screens)

### Step 2A: Planning
```markdown
# [Tên màn hình]
## Template: [01-dashboard, 04-crud-table, etc.]
## Prompt: [Chi tiết]
```

### Step 3A: Execute
// turbo
1. `mcp_stitch_create_project`
2. `mcp_stitch_generate_screen_from_text`

---

## PATH B: Multi-Screen (>= 3 screens) - STITCH LOOP

### Step 2B: Planning - CHỈ CẦN THÔNG TIN TỐI THIỂU

**Tạo `implementation_plan.md` đơn giản:**

```markdown
# [Tên App]

## Mode: STITCH LOOP

## Brand Info
- Primary: #3492ab (Wecare Blue)
- Secondary: #4CAF50 (Green)  
- Background: #F8F9FA (Off White)
- Fonts: Lexend (headings), Roboto (body)
- Logo: https://i.imgur.com/tD07Yrv.png

## Screens (chỉ cần tên + mục đích)
1. Dashboard - Tổng quan kho
2. Xuất kho - Kanban 4 cột
3. Nhập kho - Kanban 3 cột
4. Tồn kho - CRUD table
5. Kiểm kho - Form wizard
```

**Chờ user confirm "Proceed"**

---

### Step 3B: Setup Loop Files

**Tạo folder `{workspace}/{app-slug}/` với 4 files:**

#### 1. `DESIGN.md` - Copy từ brand info:
```markdown
# Design System

## Colors
- Primary: #3492ab
- Secondary: #4CAF50
- Background: #F8F9FA

## Typography
- Headings: Lexend
- Body: Roboto

## Logo
https://i.imgur.com/tD07Yrv.png

## Style Notes
Modern B2B industrial, spacious, professional.
Dark sidebar with light content area.
```

#### 2. `SITE.md` - Sitemap tracking:
```markdown
# [App Name]

## Project
- ID: [sẽ điền sau]
- URL: [sẽ điền sau]

## Sitemap
- [ ] 1. Dashboard
- [ ] 2. Xuất kho
- [ ] 3. Nhập kho
- [ ] 4. Tồn kho
- [ ] 5. Kiểm kho
```

#### 3. `stitch.json`:
```json
{
  "projectId": null,
  "screens": []
}
```

#### 4. `next-prompt.md` - Baton cho screen 1:
```markdown
---
page: dashboard
screen_number: 1
total_screens: 5
---
[Prompt cho Dashboard - TỰ ĐỘNG GENERATE TỪ TEMPLATE + DESIGN.MD]
```

---

### Step 4B: LOOP EXECUTION

```
┌─────────────────────────────────────────────────────────────┐
│  CRITICAL: ĐỌC DESIGN.MD MỘT LẦN, DÙNG CHO TẤT CẢ SCREENS  │
└─────────────────────────────────────────────────────────────┘

design_block = read("DESIGN.md")  # Đọc 1 lần

FOR each screen in SITE.md:
    
    # 1. BUILD PROMPT (tự động từ template + design)
    prompt = """
    {screen.name} for {app_purpose}.
    
    DESIGN SYSTEM:
    {design_block}
    
    Layout: Same sidebar navigation as other screens.
    Current page: {screen.name} (highlighted in nav)
    """
    
    # 2. CREATE PROJECT (chỉ lần đầu)
    IF stitch.json.projectId == null:
        projectId = mcp_stitch_create_project(title=app_name)
        save projectId to stitch.json
    
    # 3. GENERATE
    result = mcp_stitch_generate_screen_from_text(
        projectId = stitch.json.projectId,
        prompt = prompt,
        deviceType = "DESKTOP"
    )
    
    # 4. UPDATE TRACKING
    - SITE.md: Mark [x] for this screen, add URL
    - stitch.json: Add screen to array
    - Print: "✅ Screen {N}/{total}: {name} done!"
    
    # 5. UPDATE BATON (for resume capability)
    Write next-prompt.md with next screen info

END FOR
```

---

### Step 5B: Summary

```markdown
## Kết quả

| # | Screen | URL |
|---|--------|-----|
| 1 | Dashboard | [link] |
| 2 | Xuất kho | [link] |
...

**Stitch Project:** [link]
**Local folder:** [path]
```

---

## Key Differences from Manual Generation

| Manual (từng screen) | Stitch Loop |
|---------------------|-------------|
| Viết prompt chi tiết cho mỗi screen | Tự build prompt từ template + DESIGN.md |
| Design có thể khác nhau | Design NHẤT QUÁN (cùng 1 DESIGN.md) |
| Không track progress | SITE.md track [x] từng screen |
| Không resumable | next-prompt.md cho phép resume |

---

## Resume Session

```
User: "tiếp tục warehouse-app"

1. Check {workspace}/warehouse-app/next-prompt.md
2. Read screen_number, total_screens
3. If screen_number < total_screens:
   → "Found session at screen {N}/{total}. Continue?"
   → Jump to loop step N
```
