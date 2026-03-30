# Findings: System Jobs & Dataflows — crdfd_kho_binh_dinh

> **Ngày**: 2026-03-27 | **Context**: Dataflow ghi data rỗng → system jobs nghẽn

---

## 1. Vấn đề

Dataflow đang ghi data vào table `crdfd_kho_binh_dinh` → trigger Power Automate Flow (CallbackRegistration) → tạo **5,000+ system jobs** "Waiting For Resources" → nghẽn async service.

### Flow gây nghẽn
- **CallbackRegistration ID**: `ed16f9bb-ea41-f011-877a-000d3a07bac4`
- **Flow ID (Power Automate)**: `83476be6-ffab-d85c-363e-b43c408e7ae7`
- **Flow Name**: `[SourcingApp] Kho_newSP`
- **Trigger**: Create of `crdfd_kho_binh_dinh`
- **Scope**: Organization
- **Run As**: Modifying user

### System Jobs
- **Tổng**: 5,000+ jobs (statuscode = 0, "Waiting For Resources")
- **Loại**: `Flow Notification` (operationtype 75) + `Callback Registration Expander` (operationtype 79)

---

## 2. Giải pháp

1. **TẮT Flow** `83476be6-ffab-d85c-363e-b43c408e7ae7` trước
2. **Cancel bulk system jobs** từ Settings > System Jobs > Select All > Cancel
3. **Chạy lại Dataflow** sau khi cleanup
4. **Bật lại Flow** sau khi Dataflow hoàn tất

---

## 3. Power Automate Flows trigger trên `crdfd_kho_binh_dinh`

> [!IMPORTANT]
> Tổng 7 CallbackRegistration, 5 Modern Flows (1 Draft, 4 Active), 2 orphaned callbacks (workflow đã xóa).

### Active Flows

| # | Flow Name | Flow ID | Trigger | State | Owner | Modified | Hành vi |
|---|-----------|---------|---------|-------|-------|----------|---------|
| 1 | **[SourcingApp] Kho_newSP** ⚠️ | `83476be6-ffab-d85c-363e-b43c408e7ae7` | **Added** (Create) | ✅ Activated | Hieu Le Hoang | 2026-03-27 | Trigger "Refresh a dataflow" trên Power BI workspace → **FLOW GÂY NGHẼN** |
| 2 | **[Kho] - add nv mua hàng/urgent kho HCM** | `45b2a3d6-3c74-f011-b4cd-000d3a090417` | **Added** (Create) | ✅ Activated | WC Automate | 2026-01-13 | Khi thêm row: lookup sản phẩm → **update** `crdfd_kho_binh_dinh` (set NV mua hàng, NV urgent theo vị trí kho HCM/BD) |
| 3 | **[Kho] - Kho bình định_add → Update Inventory Column** | `9ee6aeaf-b0ce-ef11-a72f-6045bd1c24b8` | **Added or Modified** (Create/Update) | ✅ Activated | WC Automate | 2025-02-27 | Khi Create: check InventoryBD null → list/tạo mới `crdfd_InventoryBinhDinh` → **update** lookup InventoryBD. Khi Update (deactivate): deactive Inventory tương ứng |
| 4 | **[Kho BD] Tồn thực tế âm** | `34a3330e-4c9a-ef11-8a69-000d3ac8d88c` | **Modified** (Update) | ✅ Activated | Hieu Le Hoang | 2026-01-14 | Filter: `crdfd_tonkhothucte < 0 AND statecode eq 0`. Khi tồn thực tế âm → tạo `appnotification` cảnh báo (KHÔNG update table kho) |

### Draft / Disabled Flows

| # | Flow Name | Flow ID | Trigger | State | Owner | Modified | Hành vi |
|---|-----------|---------|---------|-------|-------|----------|---------|
| 5 | **[Quản lý đa kho] - Table kho BĐ_add → cập nhật column name theo code** | `7d436afe-880b-f011-bae3-000d3a090417` | **Added** (Create) | ⏸️ Draft | WC Automate | 2026-03-27 | Get row by ID → **update** `crdfd_productid` = `crdfd_code`. **Soft-deleted callback** |

### Orphaned Callbacks (workflow đã xóa)

| # | Callback ID | Trigger | Ghi chú |
|---|-------------|---------|---------|
| 6 | `9d5aabed-7f20-ee11-9cbe-6045bd1e46ec` | Modified | Workflow không còn tồn tại — orphaned |
| 7 | `54f07a81-5cd9-ef11-a731-000d3aa3343a` | Added | Workflow không còn tồn tại — orphaned |

> [!WARNING]
> 2 orphaned callbacks vẫn tạo system jobs mỗi khi table bị Modified/Added. Cần xóa để tránh tạo jobs rác.

---

## 4. Dataflows ghi vào `crdfd_kho_binh_dinh` — Full List

### Active (đang hoạt động)

| # | Name | Dataverse Row ID | Service DataflowId | Owner | State | Modified | Hành vi |
|---|------|-----------------|-------------------|-------|-------|----------|---------|
| 1 | Update TKTT_KhoBD | `7976779c-0c88-ee11-be36-000d3a07dd46` | `bb705ab8-2c64-46e7-beea-825cdbbeb2fa` | # dev4 | Source | 2023-11-21 | **Ghi mới + update** tồn kho thực tế |
| 2 | Kho BD - Tồn kho thực tế | `9e9cfe56-11aa-ee11-be37-000d3a08b587` | `f9a74c0d-c805-4403-8efd-0589c91c8384` | WeCare Power BI | Source | 2026-03-25 | **Ghi mới + update** tồn kho thực tế |
| 3 | Kho BD - Tồn kho thực tế (bản 2) | `b1d4a78d-12aa-ee11-be37-000d3a09a1ed` | `dc574169-797c-42c0-859f-6d5c9c594b3d` | WeCare Power BI | Active | 2026-03-25 | **Ghi mới + update** tồn kho thực tế |
| 4 | Kho BD - Tồn kho lý thuyết ⚠️ | `d7776c50-13aa-ee11-be37-000d3aa3f382` | `7441f704-6bd7-4e2c-8042-8d75924b8040` | WeCare Power BI | Active | **2026-03-27** | **Ghi mới + update** tồn kho lý thuyết |
| 5 | Kho BD - Tồn kho lý thuyết (bản 2) | `011f1b7a-12aa-ee11-be37-000d3aa3fd6f` | `ef51c0d8-6b43-4c61-893b-546f88aec14e` | WeCare Power BI | - | - | Bản Source paired |
| 6 | Promotion Sensitivity - Update cho kho BĐ, KH, TPHCM | `6eb1c88d-9a3a-f011-8c4e-000d3aa05a71` | `428a2cd4-9d0d-45a5-b81d-96cc86e554b2` | WeCare Power BI | Source | 2026-03-08 | **Update** promotion sensitivity columns |

### Deleted (đã xóa)

| # | Name | Dataverse Row ID | Service DataflowId | Owner |
|---|------|-----------------|-------------------|-------|
| 7 | Copy of - Tồn kho thực tế - BD | `58447a32-d3b0-ed11-83fe-000d3a094665` | `d83e83d1-caf7-4753-8c02-af989fb9b85b` | Phước Võ Văn Bình |
| 8 | Copy of - Tồn kho lý thuyết - BD | `8e6cf77e-60a7-ed11-aad1-000d3a856c6c` | `9cb632ba-b408-4bcc-b95e-e1ed76b1afc3` | Hieu Le Hoang |
| 9 | Copy of - Tồn kho lý thuyết - BD (copy 2) | `3f2f1dad-60a7-ed11-aad1-000d3a856eb3` | `97f6db89-ee02-41af-a637-f4996b19ff4e` | Hieu Le Hoang |
| 10 | [Kho BD] - Điểm rủi ro lệch kho | `f977d78a-a267-f011-bec3-000d3aa05a71` | `1475a93f-c938-4fc0-9cdd-1ebfc7419b7f` | WeCare Power BI |

### Ghi vào table KHÁC (liên quan Kho BD)

| # | Name | Dataverse Row ID | Service DataflowId | Target Entity |
|---|------|-----------------|-------------------|---------------|
| 11 | Kho BD - Tồn kho Tháng | `a48098f8-08c0-ee11-9079-000d3a08bafc` | `5e83cd17-f668-4274-a19b-f914f10d282f` | `crdfd_Tonkhoauthang` |
| 12 | Kho BD - Tồn kho Tháng (bản 2) | `21a7b548-debf-ee11-9079-000d3aa3f249` | `2b10ce7a-24a5-4a4f-b9a9-512d17a0cd62` | `crdfd_Tonkhoauthang` |
| 13 | Inventory BD | `4347c33b-c8ce-ed11-a7c7-000d3a094665` | `5c7e01a4-06e1-45cc-a655-0fbf69a78fa8` | `crdfd_InventoryBinhDinh` |
| 14 | Inventory BD (bản 2) | `23f6d083-e0ce-ed11-a7c7-000d3a094665` | `fc418dea-0919-4111-8761-68bb8f34bfe6` | `crdfd_InventoryBinhDinh` |

---

## 5. Tổng hợp: Ai ghi/update `crdfd_kho_binh_dinh`?

### 🔵 Ghi mới (Create rows)

| Source | Tên | Loại |
|--------|-----|------|
| **Dataflow** | Kho BD - Tồn kho thực tế (bản 2) | Dataflow (Active) |
| **Dataflow** | Kho BD - Tồn kho lý thuyết ⚠️ | Dataflow (Active) |
| **Dataflow** | Promotion Sensitivity - Update cho kho BĐ, KH, TPHCM | Dataflow (Source) |

### 🟡 Update rows (sau khi Create)

| Source | Tên | Loại | Update gì |
|--------|-----|------|-----------|
| **Flow** | [Kho] - add nv mua hàng/urgent kho HCM | Trigger on Create | Set lookup NV mua hàng, NV urgent |
| **Flow** | [Kho] - Kho bình định_add → Update Inventory Column | Trigger on Create/Update | Set lookup InventoryBD; Deactivate Inventory khi row bị deactivate |
| **Flow** | [SourcingApp] Kho_newSP ⚠️ | Trigger on Create | Refresh Power BI dataflow (không update table trực tiếp nhưng **TẠO SYSTEM JOBS**) |

### 🔴 Không update table (chỉ đọc/notify)

| Source | Tên | Loại | Hành vi |
|--------|-----|------|---------|
| **Flow** | [Kho BD] Tồn thực tế âm | Trigger on Modified | Tạo app notification khi tồn thực tế < 0 |

---

## 6. Technical Insights

### Dual ID System
- **`msdyn_dataflowid`**: ID của bản ghi trong Dataverse table `msdyn_dataflow` (row ID)
- **Service `DataflowId`** (trong `msdyn_mashupsettings`): ID thật của Dataflow trên Power Query service

### Source vs Active Dataflow
- Mỗi dataflow có **cặp**: Source (definition, ẩn trong UI) + Active (published, hiện trong UI)
- Liên kết qua `RelatedDataflowId`
- Khi search trong Power Apps UI / Workhub → chỉ Active hiện

### Key Fields của `msdyn_dataflow`
| Field | Mô tả |
|-------|--------|
| `msdyn_mashupdocument` | Full Power Query M code |
| `msdyn_mashupsettings` | Settings + target entity + field mapping + DataflowId |
| `msdyn_refreshhistory` | Lịch sử refresh |
| `msdyn_refreshsettings` | Schedule settings |
| `msdyn_destinationadls` | Destination ADLS (nếu có) |

### Cách tìm Target Entity từ API
Query `msdyn_mashupsettings` → parse JSON → `QueriesMetadata.[QueryName].EntityName` = target Dataverse table.

### Orphaned Callbacks
- 2 CallbackRegistration (`9d5aabed...`, `54f07a81...`) không còn workflow tương ứng
- Vẫn active → tạo system jobs rác mỗi khi table bị thay đổi
- **Khuyến nghị**: Xóa bằng API hoặc từ admin tools
