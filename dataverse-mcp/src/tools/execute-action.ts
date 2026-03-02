/**
 * Tool: execute_action
 * Gọi Dataverse Bound hoặc Unbound Actions.
 *
 * - Unbound Action: POST /{actionName}          (ví dụ: RemoveAppComponents)
 * - Bound Action:   POST /{entitySet}({id})/{actionName}  (ví dụ: WinOpportunity)
 *
 * Use cases phổ biến:
 *   - RemoveAppComponents: gỡ entity/form khỏi Model-Driven App
 *   - AddAppComponents: thêm component vào App
 *   - ConvertQuoteToOrder, WinOpportunity, LoseOpportunity
 *   - CalculateRollupField, RetrieveDuplicates
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ToolResult } from "../types/dataverse.js";

export const definition = {
    name: "execute_action",
    description:
        "Gọi Dataverse Bound hoặc Unbound Action. Hỗ trợ các operations phức tạp mà CRUD thông thường không làm được.\n\n" +
        "**Unbound Action** (không gắn vào record cụ thể):\n" +
        "  - Chỉ truyền actionName + body\n" +
        "  - Ví dụ: RemoveAppComponents, AddAppComponents, PublishAllXml\n\n" +
        "**Bound Action** (gắn vào 1 record):\n" +
        "  - Truyền thêm entitySetName + recordId\n" +
        "  - Ví dụ: WinOpportunity, LoseOpportunity, ConvertQuoteToOrder\n\n" +
        "**RemoveAppComponents example**:\n" +
        "  actionName: 'RemoveAppComponents'\n" +
        "  body: { AppId: { appmoduleid: '<app-guid>' }, Components: [{ objectid: '<entity-guid>', componenttype: 1 }] }",
    inputSchema: {
        type: "object" as const,
        properties: {
            actionName: {
                type: "string",
                description:
                    "Tên của Action (ví dụ: RemoveAppComponents, WinOpportunity, ConvertQuoteToOrder)",
            },
            body: {
                type: "object",
                description:
                    "JSON body truyền vào Action. Có thể là {} nếu action không cần params.",
                additionalProperties: true,
            },
            entitySetName: {
                type: "string",
                description:
                    "[Bound Action only] EntitySetName của record (ví dụ: opportunities, quotes). Bỏ trống nếu là Unbound Action.",
            },
            recordId: {
                type: "string",
                description:
                    "[Bound Action only] GUID của record cần bind action vào (ví dụ: 00000000-0000-0000-0000-000000000001). Bỏ trống nếu là Unbound Action.",
            },
        },
        required: ["actionName"],
    },
};

interface ExecuteActionArgs {
    actionName: string;
    body?: Record<string, unknown>;
    entitySetName?: string;
    recordId?: string;
}

export async function handler(
    args: ExecuteActionArgs,
    client: DataverseClient
): Promise<ToolResult> {
    const { actionName, body = {}, entitySetName, recordId } = args;
    const start = Date.now();

    // Xác định endpoint: Bound hoặc Unbound
    let endpoint: string;
    let actionType: string;

    if (entitySetName && recordId) {
        // Bound Action: POST /entitySet(recordId)/Microsoft.Dynamics.CRM.ActionName
        // Một số actions cần namespace, một số không — thử không có namespace trước
        endpoint = `/${entitySetName}(${recordId})/${actionName}`;
        actionType = `Bound (${entitySetName}/${recordId})`;
    } else {
        // Unbound Action: POST /ActionName
        endpoint = `/${actionName}`;
        actionType = "Unbound";
    }

    let result: unknown;
    try {
        result = await client.post(endpoint, body);
    } catch (err: unknown) {
        // Nếu lỗi và là Bound Action, thử thêm namespace Dynamics CRM
        if (entitySetName && recordId && err instanceof Error) {
            const namespacedEndpoint = `/${entitySetName}(${recordId})/Microsoft.Dynamics.CRM.${actionName}`;
            result = await client.post(namespacedEndpoint, body);
            endpoint = namespacedEndpoint;
        } else {
            throw err;
        }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        success: true,
                        actionName,
                        actionType,
                        endpoint,
                        elapsed: `${elapsed}s`,
                        result: result ?? null,
                        message: `✅ Action "${actionName}" thực thi thành công sau ${elapsed}s.`,
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
