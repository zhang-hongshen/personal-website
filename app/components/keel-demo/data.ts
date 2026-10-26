// What the Keel demo connects to: a local Redis and a Valkey server, each a keyspace held in the page.
// Keys with a TTL really expire while the page is open, as they would on the server.

import { pick, type L, type Text } from "~/components/demo-text";

export type KeyType = "string" | "hash" | "list" | "set" | "zset" | "stream";
export type StreamEntry = { id: string; fields: [string, string][] };
export type Data =
    | { type: "string"; value: string }
    | { type: "hash"; value: [string, string][] }
    | { type: "list"; value: string[] }
    | { type: "set"; value: string[] }
    | { type: "zset"; value: [string, number][] }
    | { type: "stream"; value: StreamEntry[] };
export type Entry = { data: Data; /** Milliseconds since the epoch, or null for no expiry. */ expiresAt: number | null };
/** Sixteen numbered databases of keys. */
export type Keyspace = Record<string, Entry>[];
export type Server = { id: string; name: L | string; address: string; color: string; product: string; version: string; keyspace: Keyspace };

/** The app's badge for each type: short name and color (KeyTypeViews.swift). */
export const TYPES: Record<KeyType, { name: L; short: string; color: string }> = {
    string: { name: ["String", "字符串", "字串"], short: "STR", color: "#007aff" },
    hash: { name: ["Hash", "哈希", "雜湊"], short: "HASH", color: "#af52de" },
    list: { name: ["List", "列表", "列表"], short: "LIST", color: "#34c759" },
    set: { name: ["Set", "集合", "集合"], short: "SET", color: "#ff9500" },
    zset: { name: ["Sorted Set", "有序集合", "有序集合"], short: "ZSET", color: "#ff2d55" },
    stream: { name: ["Stream", "流", "串流"], short: "XSTR", color: "#30b0c7" },
};

const s = (value: string, ttl?: number): Entry => ({ data: { type: "string", value }, expiresAt: ttl ? Date.now() + ttl * 1000 : null });
const h = (value: Record<string, string>): Entry => ({ data: { type: "hash", value: Object.entries(value) }, expiresAt: null });

function local(): Keyspace {
    const now = Date.now();
    const db0: Record<string, Entry> = {
        "user:1001": h({ name: "Maya Chen", email: "maya@lumen.app", plan: "pro", created_at: "2026-01-04T09:12:00Z" }),
        "user:1002": h({ name: "Leo Fischer", email: "leo@lumen.app", plan: "free", created_at: "2026-01-19T16:40:00Z" }),
        "user:1003": h({ name: "Priya Raman", email: "priya@lumen.app", plan: "pro", created_at: "2026-02-02T11:05:00Z" }),
        "user:1004": h({ name: "Sam Okafor", email: "sam@lumen.app", plan: "team", created_at: "2026-02-27T08:30:00Z" }),
        "session:a91f2c0e": s('{"user":1001,"device":"MacBook Pro","ip":"203.0.113.7"}', 1800),
        "session:b07d33a1": s('{"user":1003,"device":"iPhone","ip":"198.51.100.24"}', 642),
        "session:c4e8a9f2": s('{"user":1002,"device":"iPad","ip":"192.0.2.81"}', 95),
        "cache:home:feed": s('{"items":[{"id":81,"title":"Night City Looks"},{"id":12,"title":"Film Presets Pack"}],"generated":"2026-10-25T19:20:00Z"}', 300),
        "cache:product:5": s('{"id":5,"name":"Pro Bundle","price":19.99}', 3600),
        "rate:ip:203.0.113.7": s("17", 45),
        "counter:visits": s("48213"),
        "counter:signups": s("1290"),
        "config:feature_flags": h({ new_onboarding: "on", marketplace: "beta", ipad_split_view: "off" }),
        "queue:emails": { data: { type: "list", value: ['{"to":"maya@lumen.app","template":"receipt"}', '{"to":"leo@lumen.app","template":"welcome"}', '{"to":"sam@lumen.app","template":"reset_password"}'] }, expiresAt: null },
        "queue:thumbnails": { data: { type: "list", value: ["upload:9182", "upload:9183", "upload:9187", "upload:9190", "upload:9191"] }, expiresAt: null },
        "tags:popular": { data: { type: "set", value: ["film", "portrait", "night", "street", "bw", "travel"] }, expiresAt: null },
        "online:users": { data: { type: "set", value: ["1001", "1003", "1004"] }, expiresAt: null },
        "leaderboard:weekly": { data: { type: "zset", value: [["hana", 2840], ["maya", 2310], ["priya", 1985], ["leo", 1420], ["sam", 960]] }, expiresAt: null },
        "presets:top_sellers": { data: { type: "zset", value: [["pro-bundle", 412], ["film-pack", 388], ["night-city", 251], ["portrait", 197]] }, expiresAt: null },
        "events:orders": {
            data: {
                type: "stream", value: [
                    { id: `${now - 7_200_000}-0`, fields: [["order", "1009"], ["customer", "8"], ["total", "4.99"]] },
                    { id: `${now - 3_100_000}-0`, fields: [["order", "1010"], ["customer", "3"], ["total", "19.99"]] },
                    { id: `${now - 640_000}-0`, fields: [["order", "1011"], ["customer", "5"], ["total", "9.99"]] },
                ],
            },
            expiresAt: null,
        },
    };
    const db1: Record<string, Entry> = {
        "jobs:nightly:last_run": s("2026-10-25T03:00:12Z"),
        "jobs:nightly:status": s("ok"),
        "lock:export:42": s("worker-3", 25),
    };
    return [db0, db1, ...Array.from({ length: 14 }, () => ({}))];
}

function valkey(): Keyspace {
    const db0: Record<string, Entry> = {
        "page:/pricing": s("<html>…rendered pricing page…</html>", 900),
        "page:/": s("<html>…rendered home page…</html>", 600),
        "geo:stores": { data: { type: "zset", value: [["berlin", 3471310713498316], ["tokyo", 4171231230197045]] }, expiresAt: null },
        "stats:requests": h({ "2026-10-24": "182334", "2026-10-25": "96120" }),
    };
    return [db0, ...Array.from({ length: 15 }, () => ({}))];
}

export function servers(): Server[] {
    return [
        { id: "local", name: ["Local Redis", "本地 Redis", "本機 Redis"], address: "localhost:6379", color: "#ff3b30", product: "Redis", version: "7.4.1", keyspace: local() },
        { id: "valkey", name: ["Staging Cache", "预发布缓存", "預備環境快取"], address: "cache.staging.internal:6379", color: "#34c759", product: "Valkey", version: "8.0.2", keyspace: valkey() },
    ];
}

/** What "+" adds, in place of the app's connection editor. */
export function newServer(): Server {
    return {
        id: "dragonfly", name: "Dragonfly", address: "127.0.0.1:6380", color: "#af52de", product: "Dragonfly", version: "1.24.0",
        keyspace: [{ "hello": s("world"), "visits:today": s("12") }, ...Array.from({ length: 15 }, () => ({}))],
    };
}

/** A key's size in bytes, roughly as MEMORY USAGE reports it. */
export function memoryOf(entry: Entry): number {
    const d = entry.data;
    const text = d.type === "string" ? d.value.length
        : d.type === "hash" ? d.value.reduce((n, [f, v]) => n + f.length + v.length, 0)
            : d.type === "zset" ? d.value.reduce((n, [m]) => n + m.length + 8, 0)
                : d.type === "stream" ? d.value.reduce((n, e) => n + e.id.length + e.fields.reduce((m, [f, v]) => m + f.length + v.length, 0), 0)
                    : d.value.reduce((n, v) => n + v.length, 0);
    return 56 + text + (d.type === "string" ? 0 : 24 * (d.value.length + 1));
}

export function sizeOf(data: Data): number {
    return data.type === "string" ? data.value.length : data.value.length;
}

const UNITS: [L, number][] = [[["d", "天", "天"], 86400], [["h", "时", "時"], 3600], [["m", "分", "分"], 60], [["s", "秒", "秒"], 1]];

/** Remaining time as the app shows it: two units at most, e.g. "29m 41s". */
export function remaining(expiresAt: number, now: number, t: Text = pick("en")): string {
    let s = Math.max(0, Math.ceil((expiresAt - now) / 1000));
    const parts: string[] = [];
    for (const [unit, size] of UNITS) {
        if (s >= size || (size === 1 && !parts.length)) {
            parts.push(`${Math.floor(s / size)}${t(unit)}`);
            s %= size;
        }
    }
    return parts.slice(0, 2).join(" ");
}

/** Redis glob matching, as SCAN MATCH does it: *, ?, [abc] and \ escapes. */
export function glob(pattern: string, key: string): boolean {
    let re = "";
    for (let i = 0; i < pattern.length; i++) {
        const c = pattern[i];
        if (c === "*") re += ".*";
        else if (c === "?") re += ".";
        else if (c === "[") { const end = pattern.indexOf("]", i); if (end < 0) re += "\\["; else { re += `[${pattern.slice(i + 1, end).replace(/\\/g, "\\\\")}]`; i = end; } }
        else if (c === "\\" && i + 1 < pattern.length) re += `\\${pattern[++i]}`;
        else re += c.replace(/[.+^${}()|\\]/g, "\\$&");
    }
    return new RegExp(`^${re}$`, "s").test(key);
}
