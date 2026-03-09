/**
 * Tool: analyze_table_quality
 *
 * DATA QUALITY ANALYZER cho Dataverse table.
 *
 * Phân tích 2 khía cạnh chất lượng:
 * 1. NULL RATE — % null của từng column (data completeness)
 * 2. SUSPECT COLUMNS — cột có tên chứa keyword dev/test/draft/check...
 *    gợi ý là cột chưa production-ready hoặc có thể xóa
 *
 * Cách hoạt động:
 * 1. Lấy danh sách attributes của entity
 * 2. Chạy FetchXML aggregate countcolumn (batch 40 columns mỗi lần)
 * 3. Tính null% = (total - nonNull) / total * 100
 * 4. Flag cột tên có keyword nghi ngờ
 * 5. Trả về report sắp xếp theo null% giảm dần
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ODataResponse, ToolResult } from "../types/dataverse.js";

// ─── Suspect Keywords ────────────────────────────────────────────────────────
// Cột có tên chứa các từ này → gợi ý đang là cột WIP, test, hoặc deprecated
const SUSPECT_KEYWORDS = [
    // Development lifecycle
    "draft", "dev", "develop", "wip", "sandbox",
    // Testing
    "test", "testing", "trial", "dummy", "mock", "fake", "sample",
    // Debugging / checking
    "debug", "check", "checking", "verify", "verification", "inspect",
    // Temporary
    "temp", "tmp", "temporary", "placeholder", "interim",
    // Obsolete
    "old", "bak", "backup", "archive", "archived", "deprecated",
    "legacy", "unused", "obsolete", "retired",
    // Versioning noise
    "v1", "v2", "v3", "copy", "copy2", "new2", "new_",
    // Vietnamese
    "tamnhap", "nhap", "tamthoi", "cu", "moi_",
];

// Attribute types KHÔNG hỗ trợ countcolumn trong FetchXML
const UNSUPPORTED_TYPES = [
    "Virtual", "EntityName", "ManagedProperty", "CalendarRules",
    "EntityCollection", "PartyList",
];

interface AttrInfo {
    logicalName: string;
    displayName: string;
    attributeType: string;
    isCustomAttribute: boolean;
    isPrimaryId: boolean;
}

interface EntitySetInfo {
    EntitySetName: string;
    PrimaryIdAttribute: string;
}

export const definition = {
    name: "analyze_table_quality",
    description:
        "DATA QUALITY ANALYZER — Phân tích chất lượng của một Dataverse table theo 2 góc độ: (1) NULL RATE: % null từng column để đánh giá data completeness, (2) SUSPECT COLUMNS: phát hiện cột có tên chứa keyword dev/test/check/draft/wip/temp/old... gợi ý cột chưa production-ready hoặc cần xóa. Kết quả sort theo null% giảm dần.",
    inputSchema: {
        type: "object" as const,
        properties: {
            entityName: {
                type: "string",
                description: "Logical name của entity cần phân tích (ví dụ: ai_table, account)",
            },
            customOnly: {
                type: "boolean",
                description:
                    "Chỉ phân tích custom attributes (mặc định: true). Set false để phân tích tất cả columns.",
            },
            nullThreshold: {
                type: "number",
                description:
                    "Chỉ hiển thị columns có null% >= threshold này (mặc định: 0, tức hiển thị tất cả).",
            },
        },
        required: ["entityName"],
    },
};

const BATCH_SIZE = 40; // FetchXML aggregate tối đa columns mỗi lần

export async function handler(
    args: { entityName: string; customOnly?: boolean; nullThreshold?: number },
    client: DataverseClient
): Promise<ToolResult> {
    const { entityName } = args;
    const customOnly = args.customOnly !== false; // default true
    const nullThreshold = args.nullThreshold ?? 0;

    // 1. Lấy EntitySetName + PrimaryId
    let entityMeta: EntitySetInfo;
    try {
        entityMeta = await client.get<EntitySetInfo>(
            `/EntityDefinitions(LogicalName='${entityName}')?$select=EntitySetName,PrimaryIdAttribute`
        );
    } catch {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `❌ Table "${entityName}" không tồn tại trong Dataverse. Kiểm tra lại tên (dùng list_entities để xem danh sách tables).`,
                    }),
                },
            ],
            isError: true,
        };
    }

    // 2. Lấy attributes
    const filterParam = customOnly
        ? "&$filter=IsCustomAttribute eq true"
        : "";

    let attrData: ODataResponse<{
        LogicalName: string;
        DisplayName: { UserLocalizedLabel?: { Label: string } };
        AttributeType: string;
        IsPrimaryId: boolean;
        IsCustomAttribute: boolean;
    }>;
    try {
        attrData = await client.get<typeof attrData>(
            `/EntityDefinitions(LogicalName='${entityName}')/Attributes?$select=LogicalName,DisplayName,AttributeType,IsPrimaryId,IsCustomAttribute${filterParam}`
        );
    } catch {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        success: false,
                        error: `❌ Không thể lấy danh sách columns của table "${entityName}".`,
                    }),
                },
            ],
            isError: true,
        };
    }

    // 3. Lọc columns có thể dùng countcolumn
    const attrs: AttrInfo[] = attrData.value
        .filter(
            (a) =>
                !a.IsPrimaryId &&
                !UNSUPPORTED_TYPES.includes(a.AttributeType)
        )
        .map((a) => ({
            logicalName: a.LogicalName,
            displayName: a.DisplayName?.UserLocalizedLabel?.Label || a.LogicalName,
            attributeType: a.AttributeType,
            isCustomAttribute: a.IsCustomAttribute,
            isPrimaryId: a.IsPrimaryId,
        }));

    if (attrs.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        entity: entityName,
                        message: "Không tìm thấy columns có thể phân tích.",
                    }),
                },
            ],
        };
    }

    // 4. Đếm tổng records
    const countXml = `<fetch aggregate="true">
  <entity name="${entityName}">
    <attribute name="${entityMeta.PrimaryIdAttribute}" alias="total" aggregate="count"/>
  </entity>
</fetch>`;

    const countResult = await client.fetchXml<{ value: Array<{ total: number }> }>(
        entityMeta.EntitySetName,
        countXml
    );
    const totalRecords: number = countResult.value?.[0]?.total ?? 0;

    if (totalRecords === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        entity: entityName,
                        totalRecords: 0,
                        message: "Bảng không có bản ghi nào để phân tích.",
                    }),
                },
            ],
        };
    }

    // 5. Chạy aggregate theo batch để đếm non-null từng column
    const nonNullCounts: Record<string, number> = {};

    for (let i = 0; i < attrs.length; i += BATCH_SIZE) {
        const batch = attrs.slice(i, i + BATCH_SIZE);
        const attributeXmls = batch
            .map(
                (a) =>
                    `<attribute name="${a.logicalName}" alias="nn_${a.logicalName}" aggregate="countcolumn"/>`
            )
            .join("\n    ");

        const batchXml = `<fetch aggregate="true">
  <entity name="${entityName}">
    ${attributeXmls}
  </entity>
</fetch>`;

        try {
            const batchResult = await client.fetchXml<{ value: Array<Record<string, number>> }>(
                entityMeta.EntitySetName,
                batchXml
            );

            const row = batchResult.value?.[0] ?? {};
            for (const attr of batch) {
                const key = `nn_${attr.logicalName}`;
                nonNullCounts[attr.logicalName] = row[key] ?? 0;
            }
        } catch {
            // Nếu batch lỗi, thử từng column một
            for (const attr of batch) {
                try {
                    const singleXml = `<fetch aggregate="true">
  <entity name="${entityName}">
    <attribute name="${attr.logicalName}" alias="nn" aggregate="countcolumn"/>
  </entity>
</fetch>`;
                    const singleResult = await client.fetchXml<{ value: Array<{ nn: number }> }>(
                        entityMeta.EntitySetName,
                        singleXml
                    );
                    nonNullCounts[attr.logicalName] = singleResult.value?.[0]?.nn ?? 0;
                } catch {
                    nonNullCounts[attr.logicalName] = -1; // đánh dấu lỗi
                }
            }
        }
    }

    // 6. Tính null % và flag
    const results = attrs
        .map((attr) => {
            const nonNull = nonNullCounts[attr.logicalName];
            const nullCount = nonNull === -1 ? -1 : totalRecords - nonNull;
            const nullPct = nonNull === -1 ? null : Math.round(((totalRecords - nonNull) / totalRecords) * 1000) / 10;
            const isSuspect = SUSPECT_KEYWORDS.some((kw) =>
                attr.logicalName.toLowerCase().includes(kw)
            );

            return {
                column: attr.logicalName,
                displayName: attr.displayName,
                type: attr.attributeType,
                isCustom: attr.isCustomAttribute,
                totalRecords,
                nonNull,
                nullCount,
                nullPct,
                isSuspect,
                tags: [
                    ...(nullPct !== null && nullPct >= 90 ? ["🔴 high-null"] : []),
                    ...(nullPct !== null && nullPct >= 50 && nullPct < 90 ? ["🟡 mid-null"] : []),
                    ...(isSuspect ? ["⚠️ suspect-name"] : []),
                    ...(nullPct === 100 ? ["💀 completely-empty"] : []),
                ],
            };
        })
        .filter((r) => r.nullPct === null || r.nullPct >= nullThreshold)
        .sort((a, b) => (b.nullPct ?? -1) - (a.nullPct ?? -1));

    // 7. Summary stats
    const highNull = results.filter((r) => r.nullPct !== null && r.nullPct >= 80);
    const suspects = results.filter((r) => r.isSuspect);
    const completelyEmpty = results.filter((r) => r.nullPct === 100);

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        entity: entityName,
                        entitySet: entityMeta.EntitySetName,
                        totalRecords,
                        analyzedColumns: results.length,
                        summary: {
                            highNullColumns: highNull.length,
                            completelyEmptyColumns: completelyEmpty.length,
                            suspectNameColumns: suspects.length,
                            highNullNames: highNull.map((r) => r.column),
                            completelyEmptyNames: completelyEmpty.map((r) => r.column),
                            suspectNames: suspects.map((r) => r.column),
                        },
                        columns: results,
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
