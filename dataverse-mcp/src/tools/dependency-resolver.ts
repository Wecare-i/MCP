/**
 * @file dependency-resolver.ts
 * @description Auto-resolve blocking dependencies trước khi delete column/table.
 *
 * Chỉ xử lý các deps từ RetrieveDependenciesForDelete (blocking deps).
 * Deps tự động mất khi xóa column/table không cần xử lý.
 *
 * Auto-resolve:
 *   26 - View: xóa column khỏi XML (delete_attr) | xóa view (delete_table)
 *   60 - System Form: xóa field khỏi XML (delete_attr) | xóa form (delete_table)
 *   29 - Workflow: deactivate → delete
 *   371 - Model-driven App: RemoveAppComponents
 *   59 - Chart: delete
 *
 * Manual-only (block deletion):
 *   80 - Canvas App
 *   91 - Plugin Assembly
 *   92 - SDK Message Step
 *   300 - App Action
 */

import type { DataverseClient } from "../client/dataverse-client.js";

// ─── Constants ─────────────────────────────────────────────────────────────

const MANUAL_ONLY_TYPES = new Set([80, 91, 92, 300, 10132]);

const MANUAL_TYPE_LABELS: Record<number, string> = {
    80: "Canvas App",
    91: "Plugin Assembly",
    92: "SDK Message Processing Step",
    300: "App Action (Command Bar)",
    10132: "App Action (Custom)",
};

const AUTO_TYPE_LABELS: Record<number, string> = {
    26: "Saved Query (View)",
    59: "Chart (Saved Query Visualization)",
    60: "System Form",
    29: "Workflow / Power Automate",
    371: "Model-driven App",
};

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface BlockingDep {
    dependentcomponenttype: number;
    dependentcomponentobjectid: string;
    dependentcomponentname?: string;
    dependentcomponentparentid?: string;
}

export interface ResolveResult {
    /** Có blocking dep không thể auto-resolve → phải block việc xóa */
    hasManualDeps: boolean;
    manualDeps: Array<{ type: string; id: string; hint: string }>;
    /** Danh sách action đã tự động thực hiện */
    resolved: Array<{ type: string; id: string; action: string }>;
    errors: Array<{ type: string; id: string; error: string }>;
}

interface SavedQueryRecord {
    layoutxml: string;
    fetchxml: string;
}

interface SystemFormRecord {
    formxml: string;
}

interface WorkflowRecord {
    statecode: number;
}

interface AppRecord {
    appmoduleid: string;
}

// ─── Helper: Remove column from View XML ────────────────────────────────────

/**
 * Xóa column khỏi layoutxml và fetchxml của một Saved Query (View).
 * Không xóa view — chỉ xóa tham chiếu đến column.
 */
export async function removeColumnFromView(
    client: DataverseClient,
    viewId: string,
    attributeName: string
): Promise<string> {
    const view = await client.get<SavedQueryRecord>(
        `/savedqueries(${viewId})?$select=layoutxml,fetchxml`
    );

    let layoutxml = view.layoutxml ?? "";
    let fetchxml = view.fetchxml ?? "";

    // Xóa <cell name="attrName" .../> hoặc <cell name="attrName">...</cell> khỏi layoutxml
    const newLayoutxml = layoutxml.replace(
        new RegExp(`\\s*<cell[^>]*name=["']${attributeName}["'][^>]*/?>(?:\\s*</cell>)?`, "gi"),
        ""
    );

    // Xóa <attribute name="attrName" .../> khỏi fetchxml
    const newFetchxml = fetchxml.replace(
        new RegExp(`\\s*<attribute[^>]*name=["']${attributeName}["'][^>]*/?>(?:\\s*</attribute>)?`, "gi"),
        ""
    );

    // Cũng xóa <condition attribute="attrName" .../> khỏi fetchxml (Quick Find filters)
    const newFetchxml2 = newFetchxml.replace(
        new RegExp(`\\s*<condition[^>]*attribute=["']${attributeName}["'][^>]*/?>(?:\\s*</condition>)?`, "gi"),
        ""
    );

    // Thử cập nhật cả hai cùng lúc trước
    try {
        await client.patch(`/savedqueries(${viewId})`, { layoutxml: newLayoutxml, fetchxml: newFetchxml2 });
        return `Đã xóa column "${attributeName}" khỏi View (${viewId})`;
    } catch {
        // Nếu thất bại (Quick Find views thường reject fetchxml update)
        // → thử update riêng từng phần
    }

    // Thử update layoutxml riêng
    if (newLayoutxml !== layoutxml) {
        try {
            await client.patch(`/savedqueries(${viewId})`, { layoutxml: newLayoutxml });
        } catch {
            // layoutxml update thất bại → bỏ qua
        }
    }

    // Thử update fetchxml riêng
    if (newFetchxml2 !== fetchxml) {
        try {
            await client.patch(`/savedqueries(${viewId})`, { fetchxml: newFetchxml2 });
        } catch {
            // fetchxml update thất bại (Quick Find views) → bỏ qua, không block
        }
    }

    return `Đã xóa column "${attributeName}" khỏi View (${viewId})`;
}


// ─── Helper: Remove field from Form XML ─────────────────────────────────────

/**
 * Xóa field control khỏi formxml của một System Form.
 * Chiến lược: tìm <row> chứa <control> có id/datafieldname = attributeName → xóa entire <row>.
 * Đây là cách an toàn nhất — giữ nguyên cấu trúc sections/columns/tabs.
 *
 * ⚠️ KHÔNG dùng regex greedy [\s\S]*? trên formxml vì có thể match xuyên qua
 *    nhiều sections/columns, phá vỡ cấu trúc form.
 *
 * Nếu sau khi xóa form không còn <control> nào → xóa hẳn form.
 */
export async function removeFieldFromForm(
    client: DataverseClient,
    formId: string,
    attributeName: string
): Promise<string> {
    const form = await client.get<SystemFormRecord>(
        `/systemforms(${formId})?$select=formxml`
    );

    let formxml = form.formxml ?? "";

    // Escape attributeName for regex
    const escapedName = attributeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Strategy: Tìm và xóa từng <row> chứa control matching attributeName.
    // Ta tìm pattern <row>...<control ...datafieldname="attrName"...>...</row>
    // hoặc <row>...<control ...id="attrName"...>...</row>
    // Dùng non-greedy match nhưng chỉ trong phạm vi <row>...</row>
    // (vì <row> không thể chứa <row> con — nó chỉ chứa <cell>).
    const rowPattern = new RegExp(
        `\\s*<row>(?:(?!<row>)[\\s\\S])*?<control[^>]*(?:id|datafieldname)=["']${escapedName}["'][^>]*(?:/>|>[\\s\\S]*?</control>)(?:(?!<row>)[\\s\\S])*?</row>`,
        "gi"
    );
    formxml = formxml.replace(rowPattern, "");

    // Fallback: nếu control nằm trong <row> tự đóng hoặc pattern khác, thử xóa <cell> chứa control
    if (
        new RegExp(`(?:id|datafieldname)=["']${escapedName}["']`, "i").test(
            formxml
        )
    ) {
        const cellPattern = new RegExp(
            `\\s*<cell[^>]*>(?:(?!<cell)[\\s\\S])*?<control[^>]*(?:id|datafieldname)=["']${escapedName}["'][^>]*(?:/>|>[\\s\\S]*?</control>)(?:(?!<cell)[\\s\\S])*?</cell>`,
            "gi"
        );
        formxml = formxml.replace(cellPattern, "");
    }

    // Kiểm tra form có còn field nào không (còn <control> khác không)
    const hasRemainingControls = /<control\b/i.test(formxml);

    if (!hasRemainingControls) {
        // Form rỗng sau khi xóa field → xóa hẳn form
        await client.delete(`/systemforms(${formId})`);
        return `Đã xóa Form (${formId}) vì form trở nên rỗng sau khi gỡ field "${attributeName}".`;
    }

    await client.patch(`/systemforms(${formId})`, { formxml });
    return `Đã xóa field "${attributeName}" khỏi Form (${formId}).`;
}

// ─── Helper: Deactivate + Delete Workflow ───────────────────────────────────

/**
 * Deactivate workflow về trạng thái Draft (không delete).
 * Giữ lại workflow để user có thể review và chỉnh sửa sau.
 */
export async function deactivateWorkflow(
    client: DataverseClient,
    workflowId: string
): Promise<string> {
    let statecode = 1; // Giả sử đang Active
    try {
        const wf = await client.get<WorkflowRecord>(
            `/workflows(${workflowId})?$select=statecode`
        );
        statecode = wf.statecode;
    } catch {
        // Bỏ qua
    }

    if (statecode === 0) {
        return `Workflow (${workflowId}) đã ở trạng thái Draft — không cần thay đổi.`;
    }

    await client.patch(`/workflows(${workflowId})`, {
        statecode: 0,
        statuscode: 1, // Draft
    });
    return `Đã deactivate Workflow (${workflowId}) về Draft. Workflow vẫn được giữ lại.`;
}

// ─── Helper: Remove Table from Model-driven App ──────────────────────────────

/**
 * Gỡ entity khỏi Model-driven App bằng RemoveAppComponents action.
 * Không xóa app.
 */
export async function removeTableFromApp(
    client: DataverseClient,
    appObjectId: string,
    entityMetadataId: string
): Promise<string> {
    // Lấy appmoduleid từ appmetadataid
    let appmoduleid = appObjectId;
    try {
        const app = await client.get<AppRecord>(
            `/appmodules(${appObjectId})?$select=appmoduleid`
        );
        appmoduleid = app.appmoduleid;
    } catch {
        // Dùng objectId trực tiếp nếu không resolve được
    }

    // AppId phải là GUID string (không phải object)
    // Components phải dùng @odata.type thay vì componenttype field
    await client.post("/RemoveAppComponents", {
        AppId: appmoduleid,
        Components: [
            {
                "@odata.type": `Microsoft.Dynamics.CRM.crmbaseentity`,
                objectid: entityMetadataId,
            },
        ],
    });

    return `Đã gỡ entity khỏi Model-driven App (${appmoduleid})`;
}

// ─── Main: Resolve All Blocking Deps ────────────────────────────────────────

export interface ResolveDepsOptions {
    /** Nếu true: xóa hẳn views/forms (dùng khi xóa TABLE). Nếu false: chỉ xóa column/field khỏi XML (dùng khi xóa COLUMN). */
    deleteContainers: boolean;
    /** Tên attribute (dùng khi xóa column, để xóa đúng field trong view/form) */
    attributeName?: string;
    /** MetadataId của entity (dùng khi gỡ table khỏi app) */
    entityMetadataId?: string;
    /** Logical name của entity (dùng cho publish) */
    entityName?: string;
}

/**
 * Tự động resolve tất cả blocking dependencies.
 * Trả về ResolveResult — nếu hasManualDeps = true thì caller phải block xóa.
 */
export async function resolveBlockingDeps(
    client: DataverseClient,
    metadataId: string,
    componentType: 1 | 2, // 1 = Entity, 2 = Attribute
    options: ResolveDepsOptions
): Promise<ResolveResult> {
    const result: ResolveResult = {
        hasManualDeps: false,
        manualDeps: [],
        resolved: [],
        errors: [],
    };

    // Lấy blocking deps
    let blockingDeps: BlockingDep[] = [];
    try {
        const depResult = await client.get<{ value: BlockingDep[] }>(
            `/RetrieveDependenciesForDelete(ComponentType=@ct,ObjectId=@oid)?@ct=${componentType}&@oid=${metadataId}`
        );
        blockingDeps = depResult.value ?? [];
    } catch {
        // Không gọi được API → trả về rỗng (không block)
        return result;
    }

    if (blockingDeps.length === 0) return result;

    // Phân loại
    const manualDeps = blockingDeps.filter((d) => MANUAL_ONLY_TYPES.has(d.dependentcomponenttype));
    const autoDeps = blockingDeps.filter((d) => !MANUAL_ONLY_TYPES.has(d.dependentcomponenttype));

    // Nếu có manual deps → set flag để warning nhưng VẪN tiếp tục resolve auto deps
    if (manualDeps.length > 0) {
        result.hasManualDeps = true;
        result.manualDeps = manualDeps.map((d) => ({
            type: MANUAL_TYPE_LABELS[d.dependentcomponenttype] ?? `Type ${d.dependentcomponenttype}`,
            id: d.dependentcomponentobjectid,
            hint: getManualHint(d.dependentcomponenttype, d.dependentcomponentobjectid),
        }));
        // Tiếp tục resolve auto deps — không block
    }

    // Auto-resolve từng dep
    for (const dep of autoDeps) {
        const typeCode = dep.dependentcomponenttype;
        const depId = dep.dependentcomponentobjectid;
        const typeLabel = AUTO_TYPE_LABELS[typeCode] ?? `Type ${typeCode}`;

        try {
            let action = "";

            if (typeCode === 26) {
                // View
                if (options.deleteContainers) {
                    // Khi xóa table: views sẽ tự xóa cùng table → không cần làm gì
                    // Nếu xóa column: xóa column khỏi view XML
                    action = `View (${depId}) sẽ tự xóa cùng table — bỏ qua.`;
                } else if (options.attributeName) {
                    action = await removeColumnFromView(client, depId, options.attributeName);
                }
            } else if (typeCode === 60) {
                // System Form
                if (options.deleteContainers) {
                    // Khi xóa table: forms sẽ tự xóa cùng table → không cần làm gì
                    action = `Form (${depId}) sẽ tự xóa cùng table — bỏ qua.`;
                } else if (options.attributeName) {
                    action = await removeFieldFromForm(client, depId, options.attributeName);
                }
            } else if (typeCode === 29) {
                // Workflow — chỉ deactivate, không delete
                action = await deactivateWorkflow(client, depId);
            } else if (typeCode === 371) {
                // Model-driven App
                if (options.entityMetadataId) {
                    action = await removeTableFromApp(client, depId, options.entityMetadataId);
                }
            } else if (typeCode === 80) {
                // Canvas App: không thể auto-resolve, nhưng KHÔNG block deletion
                // Chỉ warning — table vẫn có thể xóa
                action = `⚠️ Canvas App (${depId}): cần xử lý thủ công trong Power Apps Editor.`;
            } else if (typeCode === 59) {
                // Chart
                await client.delete(`/savedqueryvisualizations(${depId})`);
                action = `Đã xóa Chart (${depId})`;
            } else {
                action = `Bỏ qua type ${typeCode} — không có handler`;
            }

            result.resolved.push({ type: typeLabel, id: depId, action });
        } catch (err: unknown) {
            result.errors.push({
                type: typeLabel,
                id: depId,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    return result;
}

// ─── Hint text cho manual deps ───────────────────────────────────────────────

function getManualHint(typeCode: number, id: string): string {
    switch (typeCode) {
        case 80:
            return `Canvas App (id=${id}): Mở Power Apps Editor → xóa tham chiếu column/table → Save & Publish.`;
        case 91:
            return `Plugin Assembly (id=${id}): Cập nhật source code plugin để bỏ tham chiếu → re-deploy.`;
        case 92:
            return `SDK Step (id=${id}): Xóa hoặc cập nhật SDK Message Processing Step trong Solution Explorer.`;
        case 300:
            return `App Action (id=${id}): Xóa Command Bar action trong Solution Explorer → Publish.`;
        default:
            return `Type ${typeCode} (id=${id}): Xử lý thủ công trong Power Apps > Solutions.`;
    }
}
