import type { Database, Kind, Table, Value } from "./data";
import type { Result } from "./sql";
import { parseVector, similarity, vectorText } from "./vector";

// The console for Qdrant and Milvus (VectorDatabases.md): one REST request, a request line and an
// optional JSON body, answered from the demo's collections the way each server's API answers.

const fail = (message: string): Result => ({ kind: "error", message, ms: 2 + Math.round(Math.random() * 6) });
const rows = (columns: string[], data: Value[][]): Result => ({ kind: "rows", columns, rows: data, ms: 3 + Math.round(Math.random() * 9) });

type Body = Record<string, unknown>;

/** Parses the console text into a method, a path and a body; returns an error result when it can't. */
function parse(text: string): { method: string; path: string; body: Body } | Result {
    const lines = text.split("\n");
    let at = 0;
    while (at < lines.length && (!lines[at].trim() || lines[at].trim().startsWith("//"))) at++;
    const m = lines[at]?.trim().match(/^(GET|POST|PUT|PATCH|DELETE)\s+(\/\S*)$/i);
    if (!m) return fail("The first line must be a request line, such as POST /collections/articles/points/query.");
    const rest = lines.slice(at + 1).join("\n").trim();
    try {
        const body = rest ? JSON.parse(rest) : {};
        return { method: m[1].toUpperCase(), path: m[2], body };
    } catch (e) {
        return fail(`The request body isn't valid JSON: ${(e as Error).message}`);
    }
}

const records = (t: Table) => t.rows.map((r) => Object.fromEntries(t.columns.map((c, i) => [c.name, r[i]])));
const vectorColumn = (t: Table) => t.columns.find((c) => /vector/i.test(c.type))!.name;

/** Points or entities as rows: the given leading columns, then the rest in the collection's order. */
function asRows(t: Table, items: { record: Record<string, Value>; score?: number }[], first: string[], withVector: boolean, scoreName: string): Result {
    const vector = vectorColumn(t);
    const others = t.columns.map((c) => c.name).filter((n) => !first.includes(n) && (withVector || n !== vector));
    const columns = [...first.filter((n) => n !== scoreName || items.some((i) => i.score !== undefined)), ...others];
    return rows(columns, items.map(({ record, score }) => columns.map((c) => (c === scoreName ? Math.round((score ?? 0) * 10000) / 10000 : record[c] ?? null))));
}

function nearest(t: Table, query: unknown, limit: number) {
    const q = Array.isArray(query) && query.every((x) => typeof x === "number") ? (query as number[]) : null;
    if (!q) return null;
    const vector = vectorColumn(t);
    return records(t)
        .map((record) => ({ record, score: similarity(q, parseVector(record[vector])!) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/** Qdrant's filter subset the demo understands: must / should / must_not with match.value and range. */
function qdrantMatches(record: Record<string, Value>, filter: Body | undefined): boolean {
    if (!filter) return true;
    const test = (c: Body) => {
        const v = record[String(c.key)];
        const match = c.match as Body | undefined;
        const range = c.range as Body | undefined;
        if (match && "value" in match) return v === match.value;
        if (match && "text" in match) return String(v ?? "").toLowerCase().includes(String(match.text).toLowerCase());
        if (range) return typeof v === "number" && (range.gt === undefined || v > Number(range.gt)) && (range.gte === undefined || v >= Number(range.gte)) && (range.lt === undefined || v < Number(range.lt)) && (range.lte === undefined || v <= Number(range.lte));
        return true;
    };
    const list = (k: string) => (Array.isArray(filter[k]) ? (filter[k] as Body[]) : []);
    return list("must").every(test) && (!list("should").length || list("should").some(test)) && !list("must_not").some(test);
}

/** A Milvus boolean expression of `field op value` parts joined with `and` / `or`. */
function milvusMatches(record: Record<string, Value>, expression: string): boolean {
    if (!expression.trim()) return true;
    return expression.split(/\s+or\s+/i).some((group) => group.split(/\s+and\s+/i).every((part) => {
        const m = part.replace(/[()]/g, "").trim().match(/^(\w+)\s*(==|!=|>=|<=|>|<|like)\s*(.+)$/i);
        if (!m) throw new Error(`cannot parse expression: ${part.trim()}`);
        const v = record[m[1]];
        const raw = m[3].trim();
        const x: Value = /^["'].*["']$/.test(raw) ? raw.slice(1, -1) : Number.isNaN(Number(raw)) ? raw : Number(raw);
        switch (m[2].toLowerCase()) {
            case "==": return v === x;
            case "!=": return v !== x;
            case ">": return Number(v) > Number(x);
            case "<": return Number(v) < Number(x);
            case ">=": return Number(v) >= Number(x);
            case "<=": return Number(v) <= Number(x);
            default: return new RegExp(`^${String(x).replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*")}$`, "i").test(String(v ?? ""));
        }
    }));
}

export function runRequest(text: string, db: Database, kind: Kind): Result {
    const parsed = parse(text);
    if ("kind" in parsed) return parsed;
    const { method, path, body } = parsed;
    const find = (name: unknown) => db.tables.find((t) => t.name === name);

    if (kind === "qdrant") {
        if (method === "GET" && path === "/collections") return rows(["name"], db.tables.map((t) => [t.name]));
        const m = path.match(/^\/collections\/([^/]+)(\/points\/(scroll|query|search))?$/);
        const t = m && find(m[1]);
        if (!m || !t) return fail(m ? `Not found: Collection \`${m[1]}\` doesn't exist! (404)` : `Not Found (404)`);
        if (!m[2]) {
            if (method !== "GET") return fail("Method Not Allowed (405)");
            return rows(["status", "points_count", "indexed_vectors_count", "config"], [["green", t.rows.length, t.rows.length, JSON.stringify(t.config)]]);
        }
        if (method !== "POST") return fail("Method Not Allowed (405)");
        const limit = Number(body.limit ?? 10);
        const withVector = body.with_vector === true;
        if (m[3] === "scroll") {
            const items = records(t).filter((r) => qdrantMatches(r, body.filter as Body | undefined)).slice(0, limit).map((record) => ({ record }));
            return asRows(t, items, ["id", "vector"], withVector || body.with_vector === undefined, "score");
        }
        const found = nearest(t, m[3] === "query" ? body.query : body.vector, limit);
        if (!found) return fail(`Format error in JSON body: ${m[3] === "query" ? "query" : "vector"} must be a list of numbers (400)`);
        return asRows(t, found.filter(({ record }) => qdrantMatches(record, body.filter as Body | undefined)), ["id", "score"], withVector, "score");
    }

    // Milvus: every endpoint is a POST under /v2/vectordb/.
    const m = path.match(/^\/v2\/vectordb\/(collections\/list|collections\/describe|entities\/query|entities\/search)$/);
    if (!m) return fail(`Not Found (404)`);
    if (method !== "POST") return fail("Method Not Allowed (405)");
    if (m[1] === "collections/list") return rows(["value"], db.tables.map((t) => [t.name]));
    const t = find(body.collectionName);
    if (!t) return fail(`collection not found[database=${String(body.dbName ?? db.name)}][collection=${String(body.collectionName ?? "")}] (code 100)`);
    if (m[1] === "collections/describe") return rows(["collectionName", "description", "load", "fields"], [[t.name, t.comment ?? "", "LoadStateLoaded", JSON.stringify(t.columns.map((c) => c.name))]]);
    const limit = Number(body.limit ?? 100);
    // "*" asks for every scalar field; a vector field is returned only when named.
    const fields = Array.isArray(body.outputFields) && !(body.outputFields as string[]).includes("*") ? (body.outputFields as string[]) : t.columns.map((c) => c.name).filter((n) => n !== vectorColumn(t));
    try {
        if (m[1] === "entities/query") {
            const items = records(t).filter((r) => milvusMatches(r, String(body.filter ?? ""))).slice(0, limit);
            const cols = fields.filter((f) => t.columns.some((c) => c.name === f));
            return rows(cols, items.map((r) => cols.map((c) => r[c] ?? null)));
        }
        const data = body.data as unknown[] | undefined;
        const found = nearest(t, data?.[0], limit);
        if (!found) return fail("invalid parameter: data must be a list of vectors (code 1100)");
        const filtered = found.filter(({ record }) => milvusMatches(record, String(body.filter ?? "")));
        const cols = ["id", "distance", ...fields.filter((f) => f !== "id" && t.columns.some((c) => c.name === f))];
        return rows(cols, filtered.map(({ record, score }) => cols.map((c) => (c === "distance" ? Math.round(score * 10000) / 10000 : record[c] ?? null))));
    } catch (e) {
        return fail(`${(e as Error).message} (code 1100)`);
    }
}

/** The request Find Similar Rows writes into the console for a vector cell. */
export function similarRequest(kind: Kind, table: Table, vector: string): string {
    const v = vectorText(parseVector(vector)!).slice(1, -1).split(",").join(", ");
    return kind === "qdrant"
        ? `POST /collections/${table.name}/points/query\n{"query": [${v}], "limit": 20, "with_payload": true}`
        : `POST /v2/vectordb/entities/search\n{"collectionName": "${table.name}", "data": [[${v}]], "annsField": "${vectorColumn(table)}", "limit": 20, "outputFields": ["*"]}`;
}
