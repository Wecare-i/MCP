/**
 * check-ai-table.js
 * Script kiểm tra nhanh ai_table trong Dataverse
 * Usage: node check-ai-table.js
 */

const { ConfidentialClientApplication } = require("@azure/msal-node");
require("dotenv").config();

const config = {
    url: process.env.DATAVERSE_URL,
    tenantId: process.env.DATAVERSE_TENANT_ID,
    clientId: process.env.DATAVERSE_CLIENT_ID,
    clientSecret: process.env.DATAVERSE_CLIENT_SECRET,
};

async function getToken() {
    const msalClient = new ConfidentialClientApplication({
        auth: {
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            authority: `https://login.microsoftonline.com/${config.tenantId}`,
        },
    });
    const result = await msalClient.acquireTokenByClientCredential({
        scopes: [`${config.url}/.default`],
    });
    return result.accessToken;
}

async function apiCall(token, path) {
    const res = await fetch(`${config.url}/api/data/v9.2/${path}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            "OData-MaxVersion": "4.0",
            "OData-Version": "4.0",
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`HTTP ${res.status}: ${err}`);
    }
    return res.json();
}

async function main() {
    console.log("🔐 Đang lấy access token...");
    const token = await getToken();
    console.log("✅ Token OK\n");

    // 1. Kiểm tra entity metadata của ai_table
    console.log("📋 1. Entity Metadata của ai_table:");
    try {
        const meta = await apiCall(
            token,
            "EntityDefinitions?$filter=LogicalName eq 'cr9fd_ai_table'&$select=LogicalName,DisplayName,Description,EntitySetName,PrimaryIdAttribute"
        );
        if (meta.value && meta.value.length > 0) {
            console.log(JSON.stringify(meta.value[0], null, 2));
        } else {
            // Thử tên không có prefix
            const meta2 = await apiCall(
                token,
                "EntityDefinitions?$filter=contains(LogicalName,'ai_table')&$select=LogicalName,DisplayName,EntitySetName"
            );
            console.log("Kết quả tìm kiếm:", JSON.stringify(meta2.value, null, 2));
        }
    } catch (e) {
        console.error("❌ Lỗi metadata:", e.message);
    }

    // 2. Thử lấy dữ liệu trực tiếp
    console.log("\n📊 2. Truy vấn dữ liệu ai_table (top 5 records):");
    const tableNames = ["cr9fd_ai_tables", "ai_tables", "new_ai_tables"];
    for (const name of tableNames) {
        try {
            const data = await apiCall(token, `${name}?$top=5`);
            console.log(`✅ Tìm thấy với endpoint: ${name}`);
            console.log(`   Số records: ${data.value.length}`);
            if (data.value.length > 0) {
                console.log("   Sample record keys:", Object.keys(data.value[0]).join(", "));
                console.log("   First record:", JSON.stringify(data.value[0], null, 2));
            }
            break;
        } catch (e) {
            console.log(`   ❌ ${name}: ${e.message.substring(0, 80)}`);
        }
    }
}

main().catch(console.error);
