/**
 * Đọc mashup document trong model.json của Dataflow Gen1.
 */

/**
 * @typedef {{ name: string, expression: string }} MashupQuery
 */

/**
 * Tách section document ("section Section1; shared A = ...; shared B = ...;") thành từng query.
 * Chỉ cắt ở dấu ; ngoài text, quoted identifier (#"...") và comment.
 * @param {string} document
 * @returns {MashupQuery[]}
 */
export function parseMashupDocument(document) {
    /** @type {string[]} */
    const members = [];
    const n = document.length;
    let start = 0;
    let i = 0;
    while (i < n) {
        const ch = document[i];
        const next = document[i + 1];
        if (ch === '"') {
            // Text hoặc quoted identifier. Hai dấu "" liền nhau là một dấu " đã escape
            i++;
            while (i < n) {
                if (document[i] === '"') {
                    if (document[i + 1] === '"') {
                        i += 2;
                        continue;
                    }
                    break;
                }
                i++;
            }
            i++;
        } else if (ch === "/" && next === "/") {
            const end = document.indexOf("\n", i);
            i = end === -1 ? n : end + 1;
        } else if (ch === "/" && next === "*") {
            const end = document.indexOf("*/", i + 2);
            i = end === -1 ? n : end + 2;
        } else if (ch === ";") {
            members.push(document.slice(start, i));
            start = i + 1;
            i++;
        } else {
            i++;
        }
    }
    if (document.slice(start).trim()) {
        members.push(document.slice(start));
    }

    /** @type {MashupQuery[]} */
    const queries = [];
    for (const member of members) {
        // Dòng "section Section1" không có dấu = nên không khớp
        const match = /^\s*(?:\[[\s\S]*?\]\s*)?(?:shared\s+)?(#"(?:[^"]|"")*"|[^\s=]+)\s*=\s*([\s\S]*)$/.exec(member);
        if (!match) continue;
        const rawName = match[1];
        const name = rawName.startsWith('#"') ? rawName.slice(2, -1).replace(/""/g, '"') : rawName;
        queries.push({ name, expression: match[2].trim() });
    }
    return queries;
}

/**
 * Map queryGroupId → tên nhóm, lấy từ annotation pbi:QueryGroups. Nhóm con có dạng "Cha/Con".
 * @param {{ annotations?: Array<{ name: string, value: string }> }} model
 * @returns {Map<string, string>}
 */
export function getQueryGroupNames(model) {
    /** @type {Map<string, string>} */
    const names = new Map();
    const annotation = model.annotations?.find((a) => a.name === "pbi:QueryGroups");
    if (!annotation) return names;

    let groups;
    try {
        groups = JSON.parse(annotation.value);
    } catch {
        return names;
    }
    if (!Array.isArray(groups)) return names;

    const byId = new Map(groups.map((g) => [g.id, g]));
    for (const group of groups) {
        const path = [];
        let current = group;
        // Giới hạn số vòng lặp phòng khi parentId trỏ thành vòng
        while (current && path.length < groups.length) {
            path.unshift(current.name);
            current = current.parentId ? byId.get(current.parentId) : undefined;
        }
        names.set(group.id, path.join("/"));
    }
    return names;
}
