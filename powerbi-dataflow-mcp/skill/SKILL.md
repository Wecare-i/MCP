---
name: powerbi-dataflow-check
description: Kiểm M code của Dataflow Gen1 mà semantic model Power BI đang dùng. Đọc model qua powerbi-modeling-mcp (file pbix mở trong Power BI Desktop, thư mục PBIP/TMDL, hoặc model trên Fabric), tìm bảng và named expression lấy dữ liệu từ PowerPlatform.Dataflows hoặc PowerBI.Dataflows, rồi export đúng các dataflow đó vào vault Obsidian bằng powerbi-dataflow-mcp. Lần export đầu tiên tự mở trang đăng nhập Microsoft. Người dùng gọi bằng: check query dataflow, kiểm dataflow của model, bảng này lấy từ dataflow nào, export dataflow của semantic model, /powerbi-dataflow-check.
---

# Kiểm dataflow mà semantic model đang dùng

Skill này nối ba MCP:

- `powerbi-modeling-mcp`: đọc model, lấy M code của partition và named expression, chạy DAX. MCP này chạy `--readonly`, không sửa được model.
- `powerbi-dataflow`: tool `dataflow_gen1_export(workspace_id, dataflow_id, query_name?)`. Tool bắt buộc có cả hai ID. Lần gọi đầu trong phiên mở trình duyệt tới trang đăng nhập Microsoft.
- `obsidian`: đọc note dataflow đã export từ các phiên trước.

Thiếu tool của `powerbi-modeling-mcp` hoặc `powerbi-dataflow` thì báo người dùng mở lại Claude Code. Không tự export bằng cách khác.

## Chỗ lưu dataflow đã export

Tool ghi vào vault Obsidian, thư mục `20 Areas/Wecare/Power BI Dataflow/`:

- `<tên workspace>/<tên dataflow>.md`: note của dataflow. Frontmatter có `dataflow_id`, `exported` (lúc export) và `dataflow_modified` (lần sửa cuối trên Service tại lúc export). Bảng `## Danh sách query` liệt kê mọi query.
- `<tên workspace>/<tên dataflow>/<tên query>.md`: note riêng của query dài. Tool chỉ tách khi note dataflow dài hơn 400 dòng.
- `Power BI Dataflow — MOC.md`: danh sách mọi dataflow đã export.

Vault là thư mục cố định và được backup bằng git, nên note còn nguyên sau khi phiên Claude Code kết thúc.

## Bước 1: Kết nối model

File `.pbix` phải đang mở trong Power BI Desktop.

1. Kiểm Desktop đã mở file chưa: `Get-Process PBIDesktop` và xem `MainWindowTitle`.
2. Chưa mở thì chạy `Start-Process "<đường dẫn .pbix>"`. Chờ đến khi process `msmdsrv` chạy và cửa sổ Desktop có tên file.
3. Gọi `connection_operations` với `{"request": {"operation": "ListLocalInstances"}}`. Chọn instance có `parentWindowTitle` trùng tên file.
4. Gọi `connection_operations` với `{"request": {"operation": "Connect", "connectionString": "data source=localhost:<port>"}}`.

Model không mở từ pbix:

- Thư mục PBIP/TMDL: `connection_operations` với operation `ConnectFolder`.
- Model trên Fabric: `connection_operations` với operation `ConnectFabric`, kèm `workspaceName` và `semanticModelName`.

## Bước 2: Tìm chỗ model lấy dữ liệu từ dataflow

1. `partition_operations` với `{"request": {"operation": "List"}}`. Giữ các partition có `sourceType` là `M`.
2. `partition_operations` với `{"request": {"operation": "Get", "references": [{"tableName": "...", "name": "..."}]}}`. Đọc field `expression`.
3. `named_expression_operations` với operation `List`, rồi `Get` với `"references": [{"name": "..."}]`. Model thường để bước lấy dataflow trong named expression, rồi bảng gộp các named expression bằng `Table.Combine`.
4. Trong M code, tìm `PowerPlatform.Dataflows(` hoặc `PowerBI.Dataflows(`. Ghi lại ba giá trị:
   - `workspaceId="..."`
   - `dataflowId="..."`
   - `entity="..."`: tên query trong dataflow.
5. Lập bảng: bảng hoặc named expression trong model → workspaceId → dataflowId → entity. Mỗi dataflowId chỉ xử lý một lần.

## Bước 3: Lấy M code của dataflow

1. Tìm note đã export: `search_metadata` với `type: "frontmatter"`, `field: "dataflow_id"`, `value: "<dataflowId>"`.
2. Có note và người dùng không yêu cầu bản mới nhất: đọc note, và báo ngày export lấy từ field `exported`.
3. Chưa có note, hoặc người dùng muốn bản mới nhất: export lại.
   - Trước lần gọi đầu, báo người dùng: "Trình duyệt sẽ mở trang đăng nhập Microsoft. Bạn đăng nhập tài khoản Power BI."
   - Gọi `dataflow_gen1_export` với `workspace_id`, `dataflow_id`, và `query_name` = tên entity.
   - Chỉ export dataflow có trong bảng ở bước 2. Không export cả workspace.
4. Lần gọi đầu bị timeout trong lúc người dùng đang đăng nhập: chờ người dùng đăng nhập xong rồi gọi lại. MCP giữ token đến hết phiên.
5. Lỗi 401 hoặc 403: tài khoản không có quyền vào workspace. Báo người dùng, không gọi lại liên tục.
6. Kết quả có `staleQueryNotes` khác rỗng: đó là note query cũ không còn được dùng. Báo người dùng, không tự xoá.

## Bước 4: Check query

1. Đọc M code của entity trong kết quả tool, hoặc trong note.
2. Entity gọi query khác trong cùng dataflow (query phụ, function): đọc thêm query đó trong note, hoặc trong note riêng của query.
3. Entity là linked entity (M code lại gọi `PowerPlatform.Dataflows` sang dataflow khác): lặp lại bước 3 cho dataflow nguồn.
4. So query với cách model dùng entity: bước lọc, cột được chọn, kiểu dữ liệu, cột dùng trong relationship và measure.
5. Cần số liệu thì chạy DAX bằng `dax_query_operations` với operation `Execute`. Lần query đầu, powerbi-modeling-mcp có thể hỏi người dùng xác nhận.

## Báo cáo

- Bảng: bảng hoặc named expression trong model → tên dataflow, dataflowId, workspace → entity → note trong vault, kèm ngày export.
- Vấn đề tìm thấy trong query, kèm link note và tên bước M.
- Không sửa model, không sửa dataflow. Ghi nhận xét vào mục `## Ghi chú` của note dataflow chỉ khi người dùng yêu cầu.
