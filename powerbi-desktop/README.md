# Power BI Desktop — Bộ MCP, skill và CLI cho agent

> Tài liệu cho việc để agent (Claude Code) đọc và sửa semantic model, report Power BI ngay trên máy, không đi qua Fabric.

**Last Updated**: 2026-09-23

Mọi thứ trong tài liệu này đã chạy thật ngày 22–23/09/2026 trên Windows 11, với report `AR_all_data_CaiTien` (repo `TMDL/AR`). Phiên bản ghi trong bài là phiên bản lúc đó.

## Tóm tắt

| Việc | Công cụ | Loại |
|---|---|---|
| Đọc model: bảng, cột, measure, relationship, chạy DAX | MCP `@microsoft/powerbi-modeling-mcp` | External (npx) |
| Sửa report: page, visual, filter, slicer, theme | Skill `powerbi-authoring:powerbi-report-cli` | Plugin Claude Code |
| Sửa model qua skill | Skill `powerbi-authoring:semantic-model-authoring` | Plugin Claude Code |
| Kiểm file PBIR đúng schema | CLI `@microsoft/powerbi-report-authoring-cli` 0.1.4 | npm global |
| Reload Desktop, chụp màn hình từng page | CLI `@microsoft/powerbi-desktop-bridge-cli` 0.1.2 | npm global |
| Export M code của Dataflow Gen1 ra Obsidian | MCP [`powerbi-dataflow-mcp`](../powerbi-dataflow-mcp/) | Self-hosted |

## 1. MCP `powerbi-modeling-mcp`

MCP của Microsoft, bản `0.5.0-beta.13`. Đây là **bản local của Power BI Authoring MCP server**; npm và repo vẫn giữ tên cũ `powerbi-modeling-mcp` (xem mục 7).

MCP này không mở file `.pbix`, không giải nén gì cả. Khi Power BI Desktop mở một file, Desktop chạy kèm một Analysis Services trên máy (`msmdsrv.exe`) ở một port ngẫu nhiên. MCP nối vào Analysis Services đó qua TOM, nên thấy đúng model đang mở.

```jsonc
// ~/.claude.json → mcpServers
"powerbi-modeling-mcp": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@microsoft/powerbi-modeling-mcp@latest", "--start", "--readonly"],
  "env": {}
}
```

Cài bằng lệnh:

```bash
claude mcp add powerbi-modeling-mcp -s user -- npx -y @microsoft/powerbi-modeling-mcp@latest --start --readonly
```

> ⚠️ Cờ `--readonly` chặn mọi thao tác ghi. Muốn agent sửa measure, cột, relationship thì bỏ cờ này. Nên giữ `--readonly` khi chỉ đọc, vì MCP sửa thẳng vào model đang mở trong Desktop.

### Bốn cách kết nối

| Operation | Nguồn | Ghi chú |
|---|---|---|
| `ListLocalInstances` → `Connect` | Desktop đang mở `.pbix` hoặc `.pbip` | Sửa model trong bộ nhớ Desktop. Phải bấm Save trong Desktop mới ghi ra file |
| `ConnectFolder` | Thư mục `.SemanticModel` (có `database.tmdl`) | Sửa thẳng file TMDL. Dùng khi Desktop đóng |
| `ConnectFabric` | Semantic model trên Fabric | Qua XMLA endpoint, cần đăng nhập |
| `ConnectBimFile` | File `.bim` | Định dạng JSON cũ |

```jsonc
// Bước 1: tìm port của Desktop đang mở
{"request": {"operation": "ListLocalInstances"}}
// → {"processId": 63280, "port": 53194, "parentWindowTitle": "AR_all_data_CaiTien"}

// Bước 2: kết nối
{"request": {"operation": "Connect", "connectionString": "data source=localhost:53194"}}

// Bước 3: chạy DAX
{"request": {"operation": "Execute", "resultMode": "Inline",
  "query": "EVALUATE SUMMARIZECOLUMNS(Customer[cr1bb_ngunggiaodichname], \"n\", COUNTROWS(Customer))"}}
```

> ⚠️ Đừng dùng `Connect` và `ConnectFolder` cùng lúc. Desktop đang mở mà agent sửa file TMDL bằng `ConnectFolder` thì lần Save tiếp theo trong Desktop sẽ ghi đè phần agent sửa.

Nhóm tool chính: `connection_operations`, `table_operations`, `column_operations`, `measure_operations`, `relationship_operations`, `partition_operations`, `named_expression_operations`, `dax_query_operations`, `database_operations` (có `ExportToTmdlFolder`, `ImportFromTmdlFolder`), `trace_operations`.

## 2. Plugin `powerbi-authoring` (skill của Microsoft)

```
/plugin marketplace add microsoft/skills-for-fabric
/plugin install powerbi-authoring@fabric-collection
```

Plugin 0.3.17 có hai skill:

| Skill | Việc |
|---|---|
| `powerbi-report-cli` | Report. Bốn mode: `planning`, `design`, `authoring` (sửa file PBIR ở local), `management` (publish qua Fabric REST API) |
| `semantic-model-authoring` | Model, DAX, nguồn dữ liệu, refresh |

Mode `authoring` **không gọi Fabric**, nên sửa report ở local không cần `az login`. Chỉ mode `management` mới cần.

> ⚠️ Plugin tự cài kèm một bản `powerbi-modeling-mcp` chạy bằng `npx`. Máy đã có bản cấp user thì hai bộ tool bị trùng. Tắt bản của plugin bằng `/mcp` → `plugin:powerbi-authoring:powerbi-modeling-mcp` → Disable.

## 3. Hai CLI cho mode `authoring`

Cần Node.js 20 trở lên.

```bash
npm install -g @microsoft/powerbi-report-authoring-cli@latest @microsoft/powerbi-desktop-bridge-cli@latest
powerbi-report-author --version   # 0.1.4
powerbi-desktop --version         # 0.1.2
```

Vòng sửa report:

```bash
powerbi-report-author validate "<đường dẫn>.Report"        # kiểm schema PBIR
powerbi-desktop status                                      # lấy PID, xem hasUnsavedChanges
powerbi-desktop reload --pid <pid>                          # Desktop nạp lại report từ đĩa
powerbi-desktop screenshot-all --pid <pid> --output-dir shots
powerbi-desktop screenshot <page-id> --pid <pid> --output p.png
```

Lệnh tra cứu, dùng thay cho đoán cấu trúc JSON:

```bash
powerbi-report-author catalog list
powerbi-report-author catalog describe cardVisual
powerbi-report-author formatting list-objects tableEx
powerbi-report-author formatting describe-object slicer general
powerbi-report-author formatting search pivotTable "columnWidth"
powerbi-report-author preview-visuals "<đường dẫn>.Report"
```

## 4. Điều kiện: report phải ở dạng PBIP với PBIR

Skill và lệnh `reload` không chạy trên `.pbix`.

1. Desktop → Options → Preview features: bật "Power BI Project (.pbip) save option" và "Store reports using enhanced metadata format (PBIR)".
2. Mở `.pbix` → File → Save as → `.pbip`.
3. Kiểm thư mục `.Report` có `definition/pages/<page>/visuals/<visual>/visual.json`. Nếu chỉ có một file `report.json` lớn thì report vẫn ở định dạng cũ.
4. Thêm vào `.gitignore`:
   ```
   **/.pbi/localSettings.json
   **/.pbi/cache.abf
   ```
5. Commit bản gốc trước khi cho agent sửa.

Publish vẫn bấm nút Publish trong Desktop từ file `.pbip`, không cần chuyển ngược về `.pbix`.

## 5. Những chỗ đã vấp

| Chỗ vấp | Chi tiết |
|---|---|
| Validator báo lỗi trên file Desktop vừa lưu | 22/09/2026, `validate` trên report vừa chuyển sang PBIR báo 118 lỗi. Phần lớn là cấu hình cũ trỏ tới bảng đã xoá khỏi model. Sau khi dọn còn 6 lỗi `PBIR_FORMATTING_PROP_NESTED` do chính Desktop ghi ra — Desktop vẫn hiển thị đúng. Đối chiếu ảnh chụp trước khi sửa theo validator |
| Đếm page bằng `ls` bị sai | Thư mục `definition/pages/` có thêm file `pages.json`. Danh sách page đúng nằm trong `pageOrder` |
| Ảnh chụp thiếu visual | `screenshot` chụp lúc visual chưa tải xong thì ảnh trống hoặc thiếu ảnh. Chụp lại trước khi kết luận là lỗi |
| Ảnh chỉ lấy nửa trên page | Page cao hơn khung nhìn và đang để `FitToWidth`. Tạm đổi `displayOption` trong `page.json` sang `FitToPage`, chụp, rồi trả lại |
| Sửa JSON bằng regex làm hỏng file | Đọc file → `JSON.parse` → sửa object → `JSON.stringify` → ghi lại. File PBIR của Desktop dùng CRLF, thụt 2 dấu cách, không có dòng trống cuối — giữ đúng để `git diff` gọn |
| Phần sửa trong Desktop bị mất | `reload` nạp lại report từ đĩa. Save trong Desktop trước khi giao việc cho agent, và kiểm `hasUnsavedChanges: false` trong `powerbi-desktop status` |
| Slicer chỉ hiện một giá trị | Page đó là page drillthrough (`pageBinding.type: "Drillthrough"`). Bộ lọc drillthrough lọc cả slicer. Cũng có thể do chữ tìm kiếm đã lưu trong `objects.general[].properties.selfFilter` |

## 6. Việc agent làm được — ví dụ thật

Ngày 22–23/09/2026 trên report `AR_all_data_CaiTien`:

- **Quét cột đang dùng.** Script Node đọc TMDL (cột, measure, calculated column, calculated table, relationship, sortByColumn, hierarchy) và mọi file JSON trong `definition/` của report, rồi đối chiếu. Kết quả: 64 cột không nơi nào dùng, 12 measure không nơi nào dùng, và 7 field mà report còn trỏ tới nhưng model đã xoá.
- **Dọn cấu hình chết.** 18 textbox và 4 matrix còn entry format trỏ tới bảng cũ; 2 slicer ẩn trỏ tới bảng không còn tồn tại. Số lỗi validator giảm từ 118 xuống 6.
- **Sửa lỗi hiển thị.** Thêm `nativeQueryRef` còn thiếu, đẩy cột phụ `Sort` ra khỏi mép matrix, bỏ dấu nháy trong tiêu đề cột.

Cách quét cột đang dùng: gom mọi tham chiếu `{"Column": {"Expression": {"SourceRef": {"Entity"|"Source"}}, "Property"}}` trong file JSON của report, cộng với tham chiếu trong DAX. Với DAX của calculated table, đếm cả tên cột viết không kèm tên bảng (`[Cột]`), nếu không sẽ báo nhầm là không dùng — ở report này cách đếm chặt hơn đã cứu 13 cột khỏi bị xoá oan.

## 7. MCP và công cụ Power BI khác

Tra ngày 23/09/2026. Phiên bản đổi nhanh, kiểm lại trước khi trích dẫn.

### MCP của Microsoft

| Tên | Làm được gì | Yêu cầu | Trạng thái |
|---|---|---|---|
| **Power BI Authoring MCP — bản local** = npm `@microsoft/powerbi-modeling-mcp` | Tạo, sửa, xoá table, column, measure, relationship, hierarchy, calculation group, security role; đổi tên hàng loạt; chạy và kiểm DAX; transaction; trace Analysis Services | Chạy stdio. Nối vào Desktop đang mở, thư mục PBIP/TMDL, hoặc Fabric qua XMLA (cần XMLA = Read Write). Không chạy trên macOS | Public preview. npm `0.5.0-beta.13` (31/08/2026) |
| **Power BI Authoring MCP — bản hosted** | Cùng bộ tool, nhưng chạy trên dịch vụ | Endpoint `https://api.fabric.microsoft.com/v1/mcp/powerbi/authoring`, đăng nhập Entra ID, quyền Write. **Không** đọc được Desktop hay file PBIP | Preview |
| **Fabric IQ MCP** | Hỏi dữ liệu bằng ngôn ngữ tự nhiên: `DiscoverArtifacts`, `GetSemanticModelSchema`, `ValueSearch`, `ExecuteQuery`. Chỉ đọc | Endpoint `https://fabriciq.svc.cloud.microsoft/v1/mcp/fabriciq`, OAuth delegated. Không hỗ trợ service principal | GA |
| **Fabric Core MCP** (remote) | Quản lý workspace, item CRUD, permission — map sang Fabric REST API | OAuth Entra ID, theo RBAC của user | Preview |
| **Fabric MCP Server** (local) | Tra spec Fabric API offline, thao tác OneLake, tạo item | Cài qua VS Code extension | Mã nguồn mở, `microsoft/mcp` |
| **fabric-rti-mcp** | KQL trên Eventhouse / Azure Data Explorer. Không liên quan semantic model | Azure Identity | MIT, `0.6.2` (16/07/2026), public preview |

> Bản local và bản hosted là **cùng một sản phẩm**. Trang Microsoft Learn gọi là "Power BI Authoring MCP server", còn npm và repo giữ tên cũ `powerbi-modeling-mcp`. Microsoft khuyến cáo không đăng ký cả hai cùng lúc, vì agent sẽ thấy hai bộ tool trùng nhau.

### MCP cộng đồng — sửa report PBIR

| Tên | Làm được gì | License · quy mô |
|---|---|---|
| [jonathan-pap/powerbi-report-mcp](https://github.com/jonathan-pap/powerbi-report-mcp) | 56 tool sửa PBIR: `pbir_create_page`, `pbir_add_visual`, `pbir_set_report_theme`, `pbir_bulk_bind`. Có **`pbir_model_usage`** phân loại field thành direct / indirect / unused, đọc cả conditional formatting để chặn xoá nhầm | MIT, 20 star, `v0.9.6` (07/05/2026) |
| [Edgargm87/powerbi-report-mcp](https://github.com/Edgargm87/powerbi-report-mcp) | Fork của repo trên | MIT, 1 star |
| [rajdeepraoextras-dev/PBI-MCP-Server](https://github.com/rajdeepraoextras-dev/PBI-MCP-Server) | Hai MCP Python: `pbi-model` (TMDL, có `pbi_model_lineage`) và `pbi-report` (PBIR, có `pbi_model_usage`). Ghi file kiểu atomic, tự backup `.bak` | Chưa xác minh license, 0 star |
| [bobzhou-source/powerbi-pbir-mcp](https://github.com/bobzhou-source/powerbi-pbir-mcp) | MCP Python thuần, sửa page/visual/theme theo lô bằng `pbir_apply_plan` | GPL-2.0, 0 star |

Đáng chú ý nhất là `pbir_model_usage` của `powerbi-report-mcp`: đúng việc "cột nào đang dùng, cột nào bỏ được" mà ở Wecare đang phải viết script riêng.

### Công cụ không phải MCP

| Tên | Làm được gì | Phiên bản |
|---|---|---|
| `@microsoft/powerbi-report-authoring-cli` | Tra capability visual, encode expression, validate PBIR | npm `0.4.0` (22/09/2026) |
| `@microsoft/powerbi-desktop-bridge-cli` | Tìm Desktop đang chạy, reload report, chụp màn hình page | npm `1.0.0` (22/09/2026) |
| Measure Killer (Brunner BI, thương mại) | Tìm measure và cột không dùng ở model, report và cả tenant. Đọc thẳng `.pbix` | `2.9.5` (23/06/2026) |
| Tabular Editor | Sửa model TMDL/TOM, Best Practice Analyzer, script C# | TE2 `2.29.0` (11/09/2026) |
| DAX Studio | Viết và đo DAX, xem query plan, server timings | `v3.6.1` (04/09/2026) |

> ⚠️ Hai CLI ở trên vừa lên bản mới tối 22/09/2026. Bản đang cài trên máy khi viết tài liệu này là `powerbi-report-author` 0.1.4 và `powerbi-desktop` 0.1.2. Chạy lại lệnh `npm install -g ...@latest` để cập nhật, và kiểm lại tên tham số sau khi cập nhật vì `powerbi-desktop` nhảy từ 0.1.x lên 1.0.0.

## Nguồn

- Power BI Report Authoring skill: https://learn.microsoft.com/en-us/power-bi/developer/agentic/power-bi-report-authoring-skill-overview
- Skills for Fabric (repo plugin): https://github.com/microsoft/skills-for-fabric/tree/main/plugins/powerbi-authoring
- PBIP / PBIR: https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-overview
- TMDL: https://learn.microsoft.com/en-us/analysis-services/tmdl/tmdl-overview
- Tổng quan MCP server cho Power BI: https://learn.microsoft.com/en-us/power-bi/developer/mcp/mcp-servers-overview
- Power BI Authoring MCP server: https://learn.microsoft.com/en-us/power-bi/developer/mcp/power-bi-authoring-mcp
- Repo `microsoft/powerbi-modeling-mcp` (cờ dòng lệnh, EULA): https://github.com/microsoft/powerbi-modeling-mcp
- Fabric IQ MCP: https://learn.microsoft.com/en-us/fabric/iq/connectors/fabric-iq-mcp
- Fabric MCP server: https://learn.microsoft.com/en-us/rest/api/fabric/articles/mcp-servers/what-is-fabric-mcp-server
- npm `@microsoft/powerbi-report-authoring-cli`: https://www.npmjs.com/package/@microsoft/powerbi-report-authoring-cli
- npm `@microsoft/powerbi-desktop-bridge-cli`: https://www.npmjs.com/package/@microsoft/powerbi-desktop-bridge-cli
- Measure Killer: https://measurekiller.com/download
- Tabular Editor releases: https://github.com/TabularEditor/TabularEditor/releases
- DAX Studio releases: https://github.com/DaxStudio/DaxStudio/releases
