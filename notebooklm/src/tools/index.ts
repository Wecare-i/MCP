/**
 * All MCP tool definitions for NotebookLM.
 * 
 * This module registers all 31+ tools with the MCP server.
 * Each tool follows the pattern: validate → call client RPC → parse response → return result.
 * 
 * The service logic is inlined (no separate service layer) since TS tools
 * directly call client.callRpc() with the appropriate RPC params.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient, getQueryTimeout, resetClient } from "../core/client.js";
import { loadCachedTokens, saveTokensToCache } from "../core/auth.js";
import {
  RPC,
  SOURCE_ADD_TIMEOUT,
  SOURCE_TYPES,
  STUDIO_TYPES,
  AUDIO_FORMATS,
  AUDIO_LENGTHS,
  VIDEO_FORMATS,
  VIDEO_STYLES,
  INFOGRAPHIC_ORIENTATIONS,
  INFOGRAPHIC_DETAILS,
  INFOGRAPHIC_STYLES,
  SLIDE_DECK_FORMATS,
  SLIDE_DECK_LENGTHS,
  FLASHCARD_DIFFICULTIES,
  SHARE_ROLES,
  CHAT_GOALS,
  CHAT_RESPONSE_LENGTHS,
  RESEARCH_SOURCES,
  RESEARCH_MODES,
  RESULT_TYPES,
  EXPORT_TYPES,
} from "../core/constants.js";
import type { ToolResponse } from "../core/types.js";

// ============================================================================
// Helpers
// ============================================================================

function success(data: Record<string, unknown> = {}): ToolResponse {
  return { status: "success", ...data };
}

function error(msg: string, extra: Record<string, unknown> = {}): ToolResponse {
  return { status: "error", error: msg, ...extra };
}

function pendingConfirmation(
  msg: string,
  settings: Record<string, unknown>,
  note?: string
): ToolResponse {
  return {
    status: "pending_confirmation",
    message: msg,
    settings,
    ...(note ? { note } : {}),
  };
}

async function safe(fn: () => Promise<ToolResponse>): Promise<ToolResponse> {
  try {
    return await fn();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return error(msg);
  }
}

// Parse notebook list raw RPC response
function parseNotebookList(result: unknown): Record<string, unknown>[] {
  if (!result || !Array.isArray(result)) return [];
  const nbList = Array.isArray(result[0]) ? result[0] : result;
  const notebooks: Record<string, unknown>[] = [];

  for (const nb of nbList) {
    if (!Array.isArray(nb) || nb.length < 3) continue;
    const title = typeof nb[0] === "string" ? nb[0] : "Untitled";
    const sourcesData = Array.isArray(nb[1]) ? nb[1] : [];
    const notebookId = nb[2];

    let ownership = "owned";
    let isShared = false;
    let createdAt: string | null = null;
    let modifiedAt: string | null = null;

    if (nb.length > 5 && Array.isArray(nb[5])) {
      const meta = nb[5];
      if (meta[0] === 2) ownership = "shared_with_me";
      if (meta.length > 1) isShared = !!meta[1];
    }

    const sources: Array<{ id: string; title: string }> = [];
    for (const src of sourcesData) {
      if (Array.isArray(src) && src.length >= 2) {
        const srcId = Array.isArray(src[0]) && src[0].length > 0 ? src[0][0] : src[0];
        const srcTitle = src[1] ?? "Untitled";
        sources.push({ id: srcId, title: srcTitle });
      }
    }

    if (notebookId) {
      notebooks.push({
        id: notebookId,
        title,
        source_count: sources.length,
        url: `https://notebooklm.google.com/notebook/${notebookId}`,
        ownership,
        is_shared: isShared,
      });
    }
  }
  return notebooks;
}

// Parse notebook detail from RPC response
function parseNotebookDetail(result: unknown, notebookId: string) {
  if (!result || !Array.isArray(result)) return null;
  const data = Array.isArray(result[0]) ? result[0] : result;
  if (!Array.isArray(data) || data.length < 3) return null;

  const title = typeof data[0] === "string" ? data[0] : "Untitled";
  const sourcesData = Array.isArray(data[1]) ? data[1] : [];
  const nbId = data[2] ?? notebookId;

  const sources: Array<{ id: string; title: string }> = [];
  for (const src of sourcesData) {
    if (Array.isArray(src) && src.length >= 2) {
      const srcId = Array.isArray(src[0]) && src[0].length > 0 ? src[0][0] : src[0];
      sources.push({ id: srcId, title: src[1] ?? "Untitled" });
    }
  }

  return { notebook_id: nbId, title, source_count: sources.length, sources, url: `https://notebooklm.google.com/notebook/${nbId}` };
}

// Parse source from add response
function parseSourceResult(result: unknown): { id: string; title: string } | null {
  if (!result || !Array.isArray(result) || result.length === 0) return null;
  const sourceList = Array.isArray(result[0]) ? result[0] : [];
  if (sourceList.length === 0) return null;
  const src = sourceList[0];
  if (!Array.isArray(src)) return null;
  const id = Array.isArray(src[0]) && src[0].length > 0 ? src[0][0] : null;
  const title = src.length > 1 ? src[1] : "Untitled";
  return id ? { id, title } : null;
}

function parseSourcesList(result: unknown): Record<string, unknown>[] {
  if (!result || !Array.isArray(result)) return [];
  const data = Array.isArray(result[0]) ? result[0] : result;
  const sourcesData = data.length > 1 && Array.isArray(data[1]) ? data[1] : [];
  const sources: Record<string, unknown>[] = [];

  for (const src of sourcesData) {
    if (!Array.isArray(src) || src.length < 3) continue;
    const sourceId = Array.isArray(src[0]) && src[0].length > 0 ? src[0][0] : null;
    const title = src[1] ?? "Untitled";
    const metadata = Array.isArray(src[2]) ? src[2] : [];
    const sourceType = metadata.length > 4 ? metadata[4] : null;
    const driveDocId = metadata.length > 0 && Array.isArray(metadata[0]) && metadata[0].length > 0 ? metadata[0][0] : null;
    let url: string | null = null;
    if (metadata.length > 7 && Array.isArray(metadata[7]) && metadata[7].length > 0) {
      url = metadata[7][0];
    }

    sources.push({
      id: sourceId,
      title,
      source_type: sourceType,
      source_type_name: SOURCE_TYPES.getName(sourceType),
      url,
      drive_doc_id: driveDocId,
      can_sync: driveDocId != null && (sourceType === 1 || sourceType === 2),
    });
  }
  return sources;
}

// ============================================================================
// Register all tools
// ============================================================================

export function registerAllTools(server: McpServer): void {
  // ========================================================================
  // NOTEBOOKS (6 tools)
  // ========================================================================

  server.tool("notebook_list", "List all notebooks", { max_results: z.number().optional().default(100).describe("Maximum number of notebooks to return") }, async ({ max_results }) => {
    return safe(async () => {
      const client = await getClient();
      const result = await client.callRpc(RPC.LIST_NOTEBOOKS, [null, 1, null, [2]]);
      const notebooks = parseNotebookList(result);
      const owned = notebooks.filter(n => n.ownership === "owned").length;
      return success({ notebooks: notebooks.slice(0, max_results), count: notebooks.length, owned_count: owned, shared_count: notebooks.length - owned });
    }).then(r => ({ content: [{ type: "text" as const, text: JSON.stringify(r) }] }));
  });

  server.tool("notebook_get", "Get notebook details with sources. Set detailed=true for full source info (type, url, drive_doc_id, can_sync)", {
    notebook_id: z.string().describe("Notebook UUID"),
    detailed: z.boolean().optional().default(false).describe("If true, return detailed source info including type, url, drive freshness"),
  }, async ({ notebook_id, detailed }) => {
    return safe(async () => {
      const client = await getClient();
      const result = await client.callRpc(RPC.GET_NOTEBOOK, [notebook_id, null, [2], null, 0], { path: `/notebook/${notebook_id}` });
      if (detailed) {
        const sources = parseSourcesList(result);
        const nb = parseNotebookDetail(result, notebook_id);
        if (!nb) return error(`Notebook ${notebook_id} not found`);
        return success({ notebook: { id: nb.notebook_id, title: nb.title, source_count: sources.length, url: nb.url }, sources });
      }
      const nb = parseNotebookDetail(result, notebook_id);
      if (!nb) return error(`Notebook ${notebook_id} not found`);
      return success({ notebook: { id: nb.notebook_id, title: nb.title, source_count: nb.source_count, url: nb.url }, sources: nb.sources });
    }).then(r => ({ content: [{ type: "text" as const, text: JSON.stringify(r) }] }));
  });

  server.tool("notebook_describe", "Get AI-generated notebook summary with suggested topics", { notebook_id: z.string().describe("Notebook UUID") }, async ({ notebook_id }) => {
    return safe(async () => {
      const client = await getClient();
      const result = await client.callRpc(RPC.GET_SUMMARY, [notebook_id, [2]], { path: `/notebook/${notebook_id}` }) as unknown[];
      let summary = "";
      const suggestedTopics: Array<{ question: string; prompt: string }> = [];
      if (Array.isArray(result)) {
        if (result.length > 0 && Array.isArray(result[0]) && (result[0] as unknown[]).length > 0) summary = (result[0] as unknown[])[0] as string;
        if (result.length > 1 && Array.isArray(result[1]) && (result[1] as unknown[]).length > 0) {
          const topics = (result[1] as unknown[])[0];
          if (Array.isArray(topics)) {
            for (const t of topics) {
              if (Array.isArray(t) && t.length >= 2) suggestedTopics.push({ question: t[0], prompt: t[1] });
            }
          }
        }
      }
      return success({ summary, suggested_topics: suggestedTopics });
    }).then(r => ({ content: [{ type: "text" as const, text: JSON.stringify(r) }] }));
  });

  server.tool("notebook_create", "Create a new notebook", { title: z.string().optional().default("").describe("Optional title") }, async ({ title }) => {
    return safe(async () => {
      const client = await getClient();
      const params = [title, null, null, [2], [1, null, null, null, null, null, null, null, null, null, [1]]];
      const result = await client.callRpc(RPC.CREATE_NOTEBOOK, params) as unknown[];
      if (Array.isArray(result) && result.length >= 3 && result[2]) {
        const nbId = result[2] as string;
        return success({ notebook_id: nbId, notebook: { id: nbId, title: title || "Untitled notebook", url: `https://notebooklm.google.com/notebook/${nbId}` }, message: `Created notebook: ${title || "Untitled notebook"}` });
      }
      return error("Failed to create notebook — no confirmation from API.");
    }).then(r => ({ content: [{ type: "text" as const, text: JSON.stringify(r) }] }));
  });

  // ========================================================================
  // SOURCES
  // ========================================================================

  server.tool("source_add", "Add a source to a notebook. Unified tool for all source types (url, text, drive, file)", {
    notebook_id: z.string().describe("Notebook UUID"),
    source_type: z.enum(["url", "text", "drive", "file"]).describe("Type of source"),
    url: z.string().optional().describe("URL (for source_type=url)"),
    urls: z.array(z.string()).optional().describe("Multiple URLs (for source_type=url, bulk)"),
    text: z.string().optional().describe("Text content (for source_type=text)"),
    title: z.string().optional().describe("Display title (for text sources)"),
    file_path: z.string().optional().describe("Local file path (for source_type=file)"),
    document_id: z.string().optional().describe("Google Drive doc ID (for source_type=drive)"),
    doc_type: z.enum(["doc", "slides", "sheets", "pdf"]).optional().default("doc").describe("Drive doc type"),
    wait: z.boolean().optional().default(false).describe("Wait for processing to complete"),
  }, async (args) => {
    return safe(async () => {
      const client = await getClient();
      const { notebook_id, source_type, url: singleUrl, urls, text, title, document_id, doc_type } = args;
      const path = `/notebook/${notebook_id}`;
      const timeout = SOURCE_ADD_TIMEOUT;

      if (source_type === "url") {
        const urlList = urls ?? (singleUrl ? [singleUrl] : []);
        if (urlList.length === 0) return error("url or urls is required for source_type=url");
        
        const sourceDataList = urlList.map(u => {
          const isYt = u.toLowerCase().includes("youtube.com") || u.toLowerCase().includes("youtu.be");
          if (isYt) return [null, null, null, null, null, null, null, [u], null, null, 1];
          return [null, null, [u], null, null, null, null, null, null, null, 1];
        });
        const params = [sourceDataList, notebook_id, [2], [1, null, null, null, null, null, null, null, null, null, [1]]];
        const result = await client.callRpc(RPC.ADD_SOURCE, params, { path, timeout });
        
        // Parse multiple sources
        const sources: Array<{ id: string; title: string }> = [];
        if (Array.isArray(result) && result.length > 0 && Array.isArray(result[0])) {
          for (const src of result[0] as unknown[]) {
            if (Array.isArray(src) && src.length > 1) {
              const id = Array.isArray(src[0]) && src[0].length > 0 ? src[0][0] : null;
              if (id) sources.push({ id, title: src[1] ?? "Untitled" });
            }
          }
        }
        return success({ sources, count: sources.length });
      }

      if (source_type === "text") {
        if (!text) return error("text is required for source_type=text");
        const t = title ?? "Pasted Text";
        const sourceData = [null, [t, text], null, 2, null, null, null, null, null, null, 1];
        const params = [[sourceData], notebook_id, [2], [1, null, null, null, null, null, null, null, null, null, [1]]];
        const result = await client.callRpc(RPC.ADD_SOURCE, params, { path, timeout });
        const src = parseSourceResult(result);
        return src ? success({ source: src }) : error("Failed to add text source");
      }

      if (source_type === "drive") {
        if (!document_id) return error("document_id is required for source_type=drive");
        const mimeMap: Record<string, string> = { doc: "application/vnd.google-apps.document", slides: "application/vnd.google-apps.presentation", sheets: "application/vnd.google-apps.spreadsheet", pdf: "application/pdf" };
        const mime = mimeMap[doc_type ?? "doc"];
        const sourceData = [[document_id, mime, 1, title ?? ""], null, null, null, null, null, null, null, null, null, 1];
        const params = [[sourceData], notebook_id, [2], [1, null, null, null, null, null, null, null, null, null, [1]]];
        const result = await client.callRpc(RPC.ADD_SOURCE, params, { path, timeout });
        const src = parseSourceResult(result);
        return src ? success({ source: src }) : error("Failed to add Drive source");
      }

      if (source_type === "file") {
        return error("File upload is not yet supported in the TypeScript MCP server. Use the Python CLI: nlm source add --file");
      }

      return error(`Unknown source_type: ${source_type}`);
    }).then(r => ({ content: [{ type: "text" as const, text: JSON.stringify(r) }] }));
  });


  server.tool("source_describe", "Get AI-generated source summary with keyword chips", { source_id: z.string().describe("Source UUID") }, async ({ source_id }) => {
    return safe(async () => {
      const client = await getClient();
      const result = await client.callRpc(RPC.GET_SOURCE_GUIDE, [[[[source_id]]]]);
      let summary = "";
      let keywords: string[] = [];
      if (Array.isArray(result) && (result as unknown[]).length > 0) {
        const r0 = (result as unknown[])[0];
        if (Array.isArray(r0) && r0.length > 0 && Array.isArray(r0[0])) {
          const inner = r0[0];
          if (inner.length > 1 && Array.isArray(inner[1]) && inner[1].length > 0) summary = inner[1][0];
          if (inner.length > 2 && Array.isArray(inner[2]) && inner[2].length > 0) keywords = Array.isArray(inner[2][0]) ? inner[2][0] : [];
        }
      }
      return success({ summary, keywords });
    }).then(r => ({ content: [{ type: "text" as const, text: JSON.stringify(r) }] }));
  });

  server.tool("source_get_content", "Get raw text content of a source (no AI processing)", { source_id: z.string().describe("Source UUID") }, async ({ source_id }) => {
    return safe(async () => {
      const client = await getClient();
      const result = await client.callRpc(RPC.GET_SOURCE, [[source_id], [2], [2]]) as unknown[];
      let content = "";
      let title = "";
      let sourceType = "";
      if (Array.isArray(result)) {
        // Source metadata at result[0]
        if (result.length > 0 && Array.isArray(result[0])) {
          const meta = result[0] as unknown[];
          if (meta.length > 1 && typeof meta[1] === "string") title = meta[1];
          if (meta.length > 2 && Array.isArray(meta[2]) && (meta[2] as unknown[]).length > 4) sourceType = SOURCE_TYPES.getName((meta[2] as unknown[])[4] as number);
        }
        // Content at result[3]
        if (result.length > 3 && Array.isArray(result[3])) {
          const blocks = result[3] as unknown[];
          const textParts: string[] = [];
          for (const block of blocks) {
            if (Array.isArray(block) && block.length >= 3 && typeof block[2] === "string") textParts.push(block[2]);
            else if (Array.isArray(block)) {
              for (const sub of block) {
                if (Array.isArray(sub) && sub.length >= 3 && typeof sub[2] === "string") textParts.push(sub[2]);
              }
            }
          }
          content = textParts.join("");
        }
      }
      return success({ content, title, source_type: sourceType, char_count: content.length });
    }).then(r => ({ content: [{ type: "text" as const, text: JSON.stringify(r) }] }));
  });

  // ========================================================================
  // QUERYING (2 tools)
  // ========================================================================

  server.tool("notebook_query", "Ask AI about sources in notebook", {
    notebook_id: z.string().describe("Notebook UUID"),
    query: z.string().describe("Question to ask"),
    source_ids: z.array(z.string()).optional().describe("Limit to specific sources"),
    conversation_id: z.string().optional().describe("Continue a conversation"),
  }, async ({ notebook_id, query, source_ids, conversation_id }) => {
    return safe(async () => {
      const client = await getClient();
      const result = await client.query(notebook_id, query, { sourceIds: source_ids, conversationId: conversation_id, timeout: getQueryTimeout() });
      return success({ answer: result.answer, conversation_id: result.conversationId, source_ids: result.sourceIds });
    }).then(r => ({ content: [{ type: "text" as const, text: JSON.stringify(r) }] }));
  });



  // ========================================================================
  // STUDIO CONTENT (4 tools)
  // ========================================================================

  server.tool("studio_create", "Create any NotebookLM studio artifact. Unified creation tool", {
    notebook_id: z.string(),
    artifact_type: z.enum(["audio", "video", "infographic", "slide_deck", "report", "flashcards", "quiz", "data_table", "mind_map"]),
    source_ids: z.array(z.string()).optional(),
    confirm: z.boolean().default(false),
    audio_format: z.string().optional().default("deep_dive"),
    audio_length: z.string().optional().default("default"),
    video_format: z.string().optional().default("explainer"),
    visual_style: z.string().optional().default("auto_select"),
    orientation: z.string().optional().default("landscape"),
    detail_level: z.string().optional().default("standard"),
    infographic_style: z.string().optional().default("auto_select"),
    slide_format: z.string().optional().default("detailed_deck"),
    slide_length: z.string().optional().default("default"),
    report_format: z.string().optional().default("Briefing Doc"),
    custom_prompt: z.string().optional().default(""),
    question_count: z.number().optional().default(2),
    difficulty: z.string().optional().default("medium"),
    language: z.string().optional().default(""),
    focus_prompt: z.string().optional().default(""),
    title: z.string().optional().default("Mind Map"),
    description: z.string().optional().default(""),
  }, async (args) => {
    const { notebook_id, artifact_type, confirm } = args;
    const lang = args.language || process.env.NOTEBOOKLM_HL || "en";

    if (!confirm) {
      const settings: Record<string, unknown> = { notebook_id, artifact_type, source_ids: args.source_ids || "all sources" };
      return { content: [{ type: "text" as const, text: JSON.stringify(pendingConfirmation(`Please confirm these settings before creating ${artifact_type}:`, settings, "Set confirm=true after user approves these settings.")) }] };
    }

    return safe(async () => {
      const client = await getClient();
      const nbUrl = `https://notebooklm.google.com/notebook/${notebook_id}`;

      if (artifact_type === "audio") {
        const fmt = AUDIO_FORMATS.getCode(args.audio_format!);
        const len = AUDIO_LENGTHS.getCode(args.audio_length!);
        const params = [notebook_id, null, null, null, null, null, null, null, [null, null, [fmt, len, lang, null, args.focus_prompt || null]], args.source_ids ? args.source_ids.map((s: string) => [s]) : null];
        const result = await client.callRpc(RPC.CREATE_STUDIO, params, { path: `/notebook/${notebook_id}` });
        return success({ artifact_type: "audio", notebook_url: nbUrl, message: "Audio overview creation started. Poll studio_status to check progress." });
      }

      if (artifact_type === "video") {
        const fmt = VIDEO_FORMATS.getCode(args.video_format!);
        const style = VIDEO_STYLES.getCode(args.visual_style!);
        const params = [notebook_id, null, null, null, null, null, null, null, null, [null, null, [fmt, lang, null, args.focus_prompt || null], [style]], args.source_ids ? args.source_ids.map((s: string) => [s]) : null];
        await client.callRpc(RPC.CREATE_STUDIO, params, { path: `/notebook/${notebook_id}` });
        return success({ artifact_type: "video", notebook_url: nbUrl, message: "Video overview creation started." });
      }

      if (artifact_type === "report") {
        const params = [notebook_id, [args.report_format, lang, null, args.custom_prompt || null, args.focus_prompt || null], null, null, null, null, null, null, null, null, args.source_ids ? args.source_ids.map((s: string) => [s]) : null];
        await client.callRpc(RPC.CREATE_STUDIO, params, { path: `/notebook/${notebook_id}` });
        return success({ artifact_type: "report", notebook_url: nbUrl, message: `Report (${args.report_format}) creation started.` });
      }

      if (artifact_type === "flashcards" || artifact_type === "quiz") {
        const diff = FLASHCARD_DIFFICULTIES.getCode(args.difficulty!);
        const count = artifact_type === "quiz" ? args.question_count : null;
        const params = [notebook_id, null, null, [diff, count, lang, null, args.focus_prompt || null], null, null, null, null, null, null, args.source_ids ? args.source_ids.map((s: string) => [s]) : null];
        await client.callRpc(RPC.CREATE_STUDIO, params, { path: `/notebook/${notebook_id}` });
        return success({ artifact_type, notebook_url: nbUrl, message: `${artifact_type} creation started.` });
      }

      if (artifact_type === "infographic") {
        const orient = INFOGRAPHIC_ORIENTATIONS.getCode(args.orientation!);
        const detail = INFOGRAPHIC_DETAILS.getCode(args.detail_level!);
        const style = INFOGRAPHIC_STYLES.getCode(args.infographic_style!);
        const params = [notebook_id, null, null, null, null, null, [orient, detail, lang, null, args.focus_prompt || null, null, null, null, style], null, null, null, args.source_ids ? args.source_ids.map((s: string) => [s]) : null];
        await client.callRpc(RPC.CREATE_STUDIO, params, { path: `/notebook/${notebook_id}` });
        return success({ artifact_type: "infographic", notebook_url: nbUrl, message: "Infographic creation started." });
      }

      if (artifact_type === "slide_deck") {
        const fmt = SLIDE_DECK_FORMATS.getCode(args.slide_format!);
        const len = SLIDE_DECK_LENGTHS.getCode(args.slide_length!);
        const params = [notebook_id, null, null, null, null, null, null, [fmt, len, lang, null, args.focus_prompt || null], null, null, args.source_ids ? args.source_ids.map((s: string) => [s]) : null];
        await client.callRpc(RPC.CREATE_STUDIO, params, { path: `/notebook/${notebook_id}` });
        return success({ artifact_type: "slide_deck", notebook_url: nbUrl, message: "Slide deck creation started." });
      }

      if (artifact_type === "data_table") {
        const params = [notebook_id, null, null, null, null, null, null, null, null, null, args.source_ids ? args.source_ids.map((s: string) => [s]) : null, [args.description, lang]];
        await client.callRpc(RPC.CREATE_STUDIO, params, { path: `/notebook/${notebook_id}` });
        return success({ artifact_type: "data_table", notebook_url: nbUrl, message: "Data table creation started." });
      }

      if (artifact_type === "mind_map") {
        const genResult = await client.callRpc(RPC.GENERATE_MIND_MAP, [notebook_id, null, null, args.source_ids ? args.source_ids.map((s: string) => [s]) : null], { path: `/notebook/${notebook_id}` });
        if (genResult) {
          await client.callRpc(RPC.SAVE_MIND_MAP, [notebook_id, [2, genResult, args.title]], { path: `/notebook/${notebook_id}` });
        }
        return success({ artifact_type: "mind_map", notebook_url: nbUrl, message: "Mind map created." });
      }

      return error(`Unknown artifact_type: ${artifact_type}`);
    }).then(r => ({ content: [{ type: "text" as const, text: JSON.stringify(r) }] }));
  });

  server.tool("studio_status", "Check studio content generation status and get URLs, or rename an artifact", {
    notebook_id: z.string(),
    action: z.enum(["status", "rename"]).default("status"),
    artifact_id: z.string().optional(),
    new_title: z.string().optional(),
  }, async ({ notebook_id, action, artifact_id, new_title }) => {
    return safe(async () => {
      const client = await getClient();

      if (action === "rename") {
        if (!artifact_id || !new_title) return error("artifact_id and new_title are required for action=rename");
        await client.callRpc(RPC.RENAME_ARTIFACT, [artifact_id, new_title]);
        return success({ action: "rename", message: `Artifact renamed to '${new_title}'`, artifact_id, new_title });
      }

      const result = await client.callRpc(RPC.POLL_STUDIO, [notebook_id, [2]]) as unknown[];
      const artifacts: Record<string, unknown>[] = [];
      let completed = 0;
      let inProgress = 0;

      if (Array.isArray(result)) {
        // Parse studio artifacts from the response
        for (const group of result) {
          if (!Array.isArray(group)) continue;
          for (const item of group) {
            if (!Array.isArray(item) || item.length < 2) continue;
            const aid = item[0];
            const data = Array.isArray(item[1]) ? item[1] : [];
            const aType = data.length > 0 ? STUDIO_TYPES.getName(data[0]) : "unknown";
            const statusVal = data.length > 1 ? data[1] : 0;
            const aTitle = data.length > 2 ? data[2] : "";
            const aUrl = data.length > 3 ? data[3] : null;
            const status = statusVal === 2 ? "completed" : statusVal === 1 ? "in_progress" : "failed";
            if (status === "completed") completed++;
            else if (status === "in_progress") inProgress++;
            artifacts.push({ artifact_id: aid, type: aType, status, title: aTitle, url: aUrl });
          }
        }
      }

      return success({
        notebook_id,
        summary: { total: artifacts.length, completed, in_progress: inProgress },
        artifacts,
        notebook_url: `https://notebooklm.google.com/notebook/${notebook_id}`,
      });
    }).then(r => ({ content: [{ type: "text" as const, text: JSON.stringify(r) }] }));
  });



  // ========================================================================
  // RESEARCH (3 tools)
  // ========================================================================

  server.tool("research_start", "Start web or Drive research", {
    notebook_id: z.string(),
    query: z.string().describe("Research query"),
    source: z.enum(["web", "drive"]).default("web"),
    mode: z.enum(["fast", "deep"]).default("fast"),
  }, async ({ notebook_id, query, source, mode }) => {
    return safe(async () => {
      const client = await getClient();
      const sourceCode = RESEARCH_SOURCES.getCode(source);
      const modeCode = RESEARCH_MODES.getCode(mode);
      const rpcId = mode === "deep" ? RPC.START_DEEP_RESEARCH : RPC.START_FAST_RESEARCH;
      const params = mode === "deep"
        ? [notebook_id, query, null, sourceCode]
        : [notebook_id, query, sourceCode, modeCode];
      const result = await client.callRpc(rpcId, params, { path: `/notebook/${notebook_id}` });
      let taskId = null;
      if (Array.isArray(result) && (result as unknown[]).length > 0) taskId = (result as unknown[])[0];
      return success({ notebook_id, task_id: taskId, query, source, mode, message: "Research started. Poll research_status to check progress." });
    }).then(r => ({ content: [{ type: "text" as const, text: JSON.stringify(r) }] }));
  });

  server.tool("research_poll", "Poll research progress or import discovered sources", {
    notebook_id: z.string(),
    task_id: z.string(),
    action: z.enum(["status", "import"]).default("status").describe("status = check progress, import = add sources to notebook"),
    source_indices: z.array(z.number()).optional().describe("For action=import: indices of sources to import (default: all)"),
  }, async ({ notebook_id, task_id, action, source_indices }) => {
    return safe(async () => {
      const client = await getClient();

      if (action === "import") {
        const params = [notebook_id, task_id, source_indices ?? null];
        const result = await client.callRpc(RPC.IMPORT_RESEARCH, params, { path: `/notebook/${notebook_id}` });
        let importedCount = 0;
        if (Array.isArray(result) && (result as unknown[]).length > 0 && Array.isArray((result as unknown[])[0])) {
          importedCount = ((result as unknown[])[0] as unknown[]).length;
        }
        return success({ notebook_id, task_id, imported_count: importedCount, message: `Imported ${importedCount} sources from research.` });
      }

      // Default: status
      const params = [notebook_id, task_id ?? null];
      const result = await client.callRpc(RPC.POLL_RESEARCH, params, { path: `/notebook/${notebook_id}` });
      const sources: Array<Record<string, unknown>> = [];
      let isComplete = false;
      if (Array.isArray(result)) {
        const r = result as unknown[];
        if (r.length > 0 && Array.isArray(r[0])) {
          for (const item of r[0] as unknown[]) {
            if (Array.isArray(item) && item.length >= 3) {
              sources.push({ title: item[0], url: item[1], snippet: item[2] ?? "", result_type: item.length > 3 ? RESULT_TYPES.getName(item[3]) : "web" });
            }
          }
        }
        isComplete = r.length > 1 && r[1] === true;
      }
      return success({ notebook_id, task_id, is_complete: isComplete, sources, source_count: sources.length });
    }).then(r => ({ content: [{ type: "text" as const, text: JSON.stringify(r) }] }));
  });

  // ========================================================================
  // NOTES (1 unified tool)
  // ========================================================================

  server.tool("note", "Manage notes in a notebook (list, create, update, delete)", {
    notebook_id: z.string(),
    action: z.enum(["list", "create", "update", "delete"]),
    note_id: z.string().optional(),
    content: z.string().optional(),
    title: z.string().optional(),
    confirm: z.boolean().optional().default(false),
  }, async ({ notebook_id, action, note_id, content, title, confirm }) => {
    return safe(async () => {
      const client = await getClient();
      const path = `/notebook/${notebook_id}`;

      if (action === "list") {
        const result = await client.callRpc(RPC.GET_NOTES, [notebook_id, [2]], { path }) as unknown[];
        const notes: Array<Record<string, unknown>> = [];
        if (Array.isArray(result)) {
          for (const item of result) {
            if (Array.isArray(item) && item.length >= 3) {
              notes.push({ id: item[0], title: item[1] ?? "", content: item[2] ?? "" });
            }
          }
        }
        return success({ notebook_id, notes, count: notes.length });
      }

      if (action === "create") {
        if (!content) return error("content is required for action=create");
        const result = await client.callRpc(RPC.CREATE_NOTE, [notebook_id, [1, content, title ?? ""]], { path });
        return success({ notebook_id, message: "Note created successfully." });
      }

      if (action === "update") {
        if (!note_id) return error("note_id is required for action=update");
        if (!content) return error("content is required for action=update");
        await client.callRpc(RPC.UPDATE_NOTE, [note_id, content, title ?? null], { path });
        return success({ note_id, message: "Note updated." });
      }

      if (action === "delete") {
        if (!note_id) return error("note_id is required for action=delete");
        if (!confirm) return error("Deletion not confirmed. Set confirm=true after user approval.", { warning: "This action is IRREVERSIBLE." });
        await client.callRpc(RPC.DELETE_NOTE, [note_id], { path });
        return success({ note_id, message: "Note permanently deleted." });
      }

      return error(`Unknown action: ${action}`);
    }).then(r => ({ content: [{ type: "text" as const, text: JSON.stringify(r) }] }));
  });



  // ========================================================================
  // AUTH
  // ========================================================================

  server.tool("refresh_auth", "Reload auth tokens", {}, async () => {
    return safe(async () => {
      resetClient();
      const client = await getClient();
      return success({ message: "Auth tokens refreshed successfully." });
    }).then(r => ({ content: [{ type: "text" as const, text: JSON.stringify(r) }] }));
  });

}
