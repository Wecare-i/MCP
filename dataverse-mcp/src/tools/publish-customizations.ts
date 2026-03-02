/**
 * Tool: publish_customizations
 * Hỗ trợ 2 mode:
 *   - PublishXml(entityNames)  → publish riêng từng entity (tránh conflict)
 *   - PublishAllXml            → publish toàn bộ (fallback khi không có entityNames)
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ToolResult } from "../types/dataverse.js";

export const definition = {
    name: "publish_customizations",
    description:
        "Publish tất cả customizations trong Dataverse (PublishAllXml). Cần chạy sau khi sửa Views, Forms, Charts để Dataverse refresh dependency graph trước khi drop column/table.\n\nNếu cần publish riêng 1 hoặc nhiều entity (tránh conflict khi PublishAll đang chạy), truyền mảng entityNames. Ví dụ: ['account', 'contact'].",
    inputSchema: {
        type: "object" as const,
        properties: {
            entityNames: {
                type: "array",
                items: { type: "string" },
                description:
                    "Danh sách logical name của các entity cần publish (ví dụ: ['account', 'cr_myentity']). Nếu bỏ trống thì publish ALL.",
            },
        },
        required: [],
    },
};

interface PublishArgs {
    entityNames?: string[];
}

export async function handler(
    args: PublishArgs,
    client: DataverseClient
): Promise<ToolResult> {
    const start = Date.now();
    const entityNames = args.entityNames ?? [];

    if (entityNames.length > 0) {
        // Publish riêng từng entity — tránh conflict với PublishAll đang chạy
        const entitiesXml = entityNames
            .map((e) => `<entity>${e}</entity>`)
            .join("");

        const parameterXml = `<importexportxml><entities>${entitiesXml}</entities></importexportxml>`;

        await client.post("/PublishXml", { ParameterXml: parameterXml });

        const elapsed = ((Date.now() - start) / 1000).toFixed(1);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(
                        {
                            success: true,
                            mode: "PublishXml (targeted)",
                            entities: entityNames,
                            message: `✅ PublishXml hoàn thành sau ${elapsed}s cho ${entityNames.length} entity: ${entityNames.join(", ")}.`,
                            tip: "Bây giờ có thể thử delete_attribute hoặc delete_table.",
                        },
                        null,
                        2
                    ),
                },
            ],
        };
    }

    // Fallback: publish all
    await client.post("/PublishAllXml", {});

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        success: true,
                        mode: "PublishAllXml",
                        message: `✅ PublishAllXml hoàn thành sau ${elapsed}s. Dependency graph đã được refresh.`,
                        tip: "Bây giờ có thể thử delete_attribute hoặc delete_table.",
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
