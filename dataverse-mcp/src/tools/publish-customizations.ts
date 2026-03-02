/**
 * Tool: publish_customizations
 * Gọi PublishAllXml action để publish toàn bộ customizations trong Dataverse.
 * Cần thiết sau khi sửa Views, Forms, Charts để Dataverse refresh dependency graph.
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ToolResult } from "../types/dataverse.js";

export const definition = {
    name: "publish_customizations",
    description:
        "Publish tất cả customizations trong Dataverse (PublishAllXml). Cần chạy sau khi sửa Views, Forms, Charts để Dataverse refresh dependency graph trước khi drop column/table.",
    inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
    },
};

export async function handler(
    _args: Record<string, never>,
    client: DataverseClient
): Promise<ToolResult> {
    const start = Date.now();

    await client.post("/PublishAllXml", {});

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        success: true,
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
