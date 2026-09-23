/**
 * Hàm dùng chung cho hai cách ghi file: note Obsidian (obsidian.js) và thư mục repo (repo.js).
 */

import { readFile } from "node:fs/promises";

export const GENERATED_BY = "powerbi-dataflow-mcp";
export const START = "<!-- export:start -->";
export const END = "<!-- export:end -->";

// Ký tự không dùng được trong tên file Windows, cộng các ký tự làm hỏng wikilink của Obsidian
const INVALID_NAME_CHARS = /[<>:"/\\|?*#^[\]\u0000-\u001f]/g;

/**
 * Đổi tên dataflow hoặc tên query thành tên file dùng được.
 * @param {string} name
 */
export function toSafeName(name) {
    const safe = name.replace(INVALID_NAME_CHARS, "_").trim().replace(/^\.+|\.+$/g, "");
    return safe || "_";
}

/**
 * Đưa chữ vào một ô của bảng Markdown.
 * Escape dấu \ trước dấu |, nếu không dấu \ có sẵn trong tên query sẽ nuốt mất dấu \ mình thêm vào.
 * Xuống dòng đổi thành dấu cách, vì một dòng của bảng Markdown phải nằm gọn trên một dòng.
 * @param {string} text
 */
export function cell(text) {
    return text.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

/**
 * Khối code powerquery. Dấu ``` trong M code được xử lý bằng cách nới rào.
 * @param {string} code
 */
export function codeBlock(code) {
    let fence = "```";
    while (code.includes(fence)) fence += "`";
    return [`${fence}powerquery`, code, fence];
}

/**
 * Vị trí của dòng chỉ chứa marker. Không tính marker nhắc tới giữa câu.
 * @param {string} text
 * @param {string} marker
 */
export function findMarkerLine(text, marker) {
    const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(`^${escaped}\\r?$`, "m").exec(text);
    return match ? match.index : -1;
}

/** @param {string} path */
export async function readIfExists(path) {
    try {
        return await readFile(path, "utf8");
    } catch (error) {
        if (error.code === "ENOENT") return null;
        throw error;
    }
}

/** @param {string} text */
export function countLines(text) {
    return text.split("\n").length;
}

/** @param {number} n */
export const pad = (n) => String(n).padStart(2, "0");

/** @param {Date} d YYYY-MM-DD theo giờ máy */
export function formatDate(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** @param {Date} d YYYY-MM-DDTHH:mm theo giờ máy */
export function formatDateTime(d) {
    return `${formatDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** @param {Date} d DD/MM/YYYY HH:mm theo giờ máy */
export function formatHuman(d) {
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** @param {string | undefined} value Giá trị exported dạng YYYY-MM-DDTHH:mm */
export function formatHumanDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? "");
    return match ? `${match[3]}/${match[2]}/${match[1]}` : "TBD";
}

/**
 * Link Markdown thường, dùng được trên GitHub, VS Code và cả Obsidian.
 * @param {string} target Đường dẫn tương đối so với file đang ghi
 * @param {string} label
 */
export function link(target, label) {
    return `[${label.replace(/[[\]]/g, "_")}](${encodeURI(target)})`;
}
