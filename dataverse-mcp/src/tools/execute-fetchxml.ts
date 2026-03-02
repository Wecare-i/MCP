/**
 * Tool: execute_fetchxml
 * Truy vấn Dataverse bằng FetchXML cho các truy vấn phức tạp
 */

import type { DataverseClient } from "../client/dataverse-client.js";
import type { ODataResponse, ToolResult } from "../types/dataverse.js";

export const definition = {
    name: "execute_fetchxml",
    description:
        "Truy vấn Dataverse bằng FetchXML - ngôn ngữ query riêng của Dataverse. Hỗ trợ aggregation, linked entities, complex conditions mà OData không làm được. Cần cung cấp EntitySetName và FetchXML string.",
    inputSchema: {
        type: "object" as const,
        properties: {
            entitySetName: {
                type: "string",
                description:
                    "EntitySetName (plural form, ví dụ: accounts, contacts)",
            },
            fetchXml: {
                type: "string",
                description: `FetchXML query string. Ví dụ:
<fetch top="10">
  <entity name="account">
    <attribute name="name"/>
    <attribute name="revenue"/>
    <filter>
      <condition attribute="statecode" operator="eq" value="0"/>
    </filter>
    <order attribute="revenue" descending="true"/>
  </entity>
</fetch>`,
            },
        },
        required: ["entitySetName", "fetchXml"],
    },
};

export async function handler(
    args: { entitySetName: string; fetchXml: string },
    client: DataverseClient
): Promise<ToolResult> {
    const data = await client.fetchXml<ODataResponse<Record<string, unknown>>>(
        args.entitySetName,
        args.fetchXml
    );

    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(
                    {
                        entitySet: args.entitySetName,
                        returnedCount: data.value.length,
                        records: data.value,
                    },
                    null,
                    2
                ),
            },
        ],
    };
}
