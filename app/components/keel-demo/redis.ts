import { glob, memoryOf, type Data, type Entry, type Server } from "./data";

// Redis commands for the console, run against the demo's keyspace, with replies in RESP terms that
// `format` prints the way redis-cli does.

export type Reply = { ok: string } | { error: string } | { int: number } | { bulk: string | null } | { array: Reply[] };

const OK: Reply = { ok: "OK" };
const nil: Reply = { bulk: null };
const int = (n: number): Reply => ({ int: n });
const bulk = (s: string): Reply => ({ bulk: s });
const array = (items: string[]): Reply => ({ array: items.map(bulk) });
const err = (message: string): Reply => ({ error: message });
const WRONGTYPE = err("WRONGTYPE Operation against a key holding the wrong kind of value");

/** Command names the console completes, in the order it offers them. */
export const COMMANDS = [
    "APPEND", "DBSIZE", "DECR", "DEL", "ECHO", "EXISTS", "EXPIRE", "FLUSHDB", "GET", "HDEL", "HGET", "HGETALL", "HKEYS", "HLEN", "HSET",
    "INCR", "INCRBY", "INFO", "KEYS", "LLEN", "LPOP", "LPUSH", "LRANGE", "MEMORY USAGE", "MGET", "PERSIST", "PING", "RENAME", "RPOP", "RPUSH",
    "SADD", "SCAN", "SCARD", "SELECT", "SET", "SISMEMBER", "SMEMBERS", "SREM", "STRLEN", "TTL", "TYPE", "XADD", "XLEN", "XRANGE",
    "ZADD", "ZCARD", "ZINCRBY", "ZRANGE", "ZREVRANGE", "ZSCORE",
];

/** Commands that delete data, which the console asks to confirm first (the app's dangerous-command guard). */
export const DANGEROUS = new Set(["FLUSHDB", "FLUSHALL"]);

/** Splits a command line the way redis-cli does, honoring double and single quotes. */
export function parseLine(line: string): string[] {
    const args: string[] = [];
    const re = /"((?:\\.|[^"\\])*)"|'([^']*)'|(\S+)/g;
    for (let m = re.exec(line); m; m = re.exec(line)) args.push(m[1] !== undefined ? m[1].replace(/\\(.)/g, "$1") : m[2] ?? m[3]);
    return args;
}

/** Drops keys whose TTL has passed, as the server does when they are touched. */
export function expire(db: Record<string, Entry>, now = Date.now()) {
    let changed = false;
    for (const [k, e] of Object.entries(db)) if (e.expiresAt !== null && e.expiresAt <= now) { delete db[k]; changed = true; }
    return changed;
}

/** Runs one command on `server`'s database `index`; returns the reply and the database selected afterwards. */
export function execute(server: Server, index: number, args: string[]): { reply: Reply; db: number } {
    const db = server.keyspace[index];
    expire(db);
    const [name = "", ...a] = args;
    const cmd = name.toUpperCase();
    const arity = (n: number, exact = true) => (exact ? a.length !== n : a.length < n) ? err(`ERR wrong number of arguments for '${name.toLowerCase()}' command`) : null;
    const get = <T extends Data["type"]>(key: string, type: T): Extract<Data, { type: T }> | null | "wrong" => {
        const e = db[key];
        if (!e) return null;
        return e.data.type === type ? (e.data as Extract<Data, { type: T }>) : "wrong";
    };
    const make = <T extends Data["type"]>(key: string, type: T): Extract<Data, { type: T }> | "wrong" => {
        const found = get(key, type);
        if (found) return found;
        const data = { type, value: type === "string" ? "" : [] } as Extract<Data, { type: T }>;
        db[key] = { data, expiresAt: null };
        return data;
    };
    const done = (reply: Reply) => ({ reply, db: index });

    switch (cmd) {
        case "PING": return done(a[0] !== undefined ? bulk(a[0]) : { ok: "PONG" });
        case "ECHO": return done(arity(1) ?? bulk(a[0]));
        case "SELECT": {
            const n = Number(a[0]);
            if (arity(1)) return done(arity(1)!);
            if (!Number.isInteger(n) || n < 0 || n > 15) return done(err("ERR DB index is out of range"));
            return { reply: OK, db: n };
        }
        case "DBSIZE": return done(int(Object.keys(db).length));
        case "FLUSHDB": for (const k of Object.keys(db)) delete db[k]; return done(OK);
        case "KEYS": return done(arity(1) ?? array(Object.keys(db).filter((k) => glob(a[0], k)).sort()));
        case "SCAN": {
            const at = a.findIndex((x) => x.toUpperCase() === "MATCH");
            const keys = Object.keys(db).filter((k) => at < 0 || glob(a[at + 1] ?? "*", k)).sort();
            return done({ array: [bulk("0"), array(keys)] });
        }
        case "EXISTS": return done(arity(1, false) ?? int(a.filter((k) => k in db).length));
        case "DEL": case "UNLINK": {
            if (arity(1, false)) return done(arity(1, false)!);
            let n = 0;
            for (const k of a) if (k in db) { delete db[k]; n++; }
            return done(int(n));
        }
        case "TYPE": return done(arity(1) ?? { ok: db[a[0]]?.data.type ?? "none" });
        case "TTL": case "PTTL": {
            if (arity(1)) return done(arity(1)!);
            const e = db[a[0]];
            if (!e) return done(int(-2));
            if (e.expiresAt === null) return done(int(-1));
            const ms = e.expiresAt - Date.now();
            return done(int(cmd === "TTL" ? Math.ceil(ms / 1000) : ms));
        }
        case "EXPIRE": {
            if (arity(2)) return done(arity(2)!);
            const e = db[a[0]];
            if (!e) return done(int(0));
            e.expiresAt = Date.now() + Number(a[1]) * 1000;
            return done(int(1));
        }
        case "PERSIST": {
            const e = db[a[0]];
            if (!e || e.expiresAt === null) return done(int(0));
            e.expiresAt = null;
            return done(int(1));
        }
        case "RENAME": {
            if (arity(2)) return done(arity(2)!);
            if (!db[a[0]]) return done(err("ERR no such key"));
            db[a[1]] = db[a[0]];
            delete db[a[0]];
            return done(OK);
        }
        case "MEMORY": {
            if (a[0]?.toUpperCase() !== "USAGE" || !a[1]) return done(err("ERR unknown subcommand or wrong number of arguments for 'memory'"));
            return done(db[a[1]] ? int(memoryOf(db[a[1]])) : nil);
        }
        case "INFO": return done(bulk(`# Server\r\n${server.product.toLowerCase()}_version:${server.version}\r\nos:Darwin 25.0.0 arm64\r\nuptime_in_days:12\r\n\r\n# Keyspace\r\n${server.keyspace.map((d, i) => (Object.keys(d).length ? `db${i}:keys=${Object.keys(d).length},expires=${Object.values(d).filter((e) => e.expiresAt).length}` : "")).filter(Boolean).join("\r\n")}`));

        case "GET": {
            if (arity(1)) return done(arity(1)!);
            const v = get(a[0], "string");
            return done(v === "wrong" ? WRONGTYPE : v ? bulk(v.value) : nil);
        }
        case "MGET": return done({ array: a.map((k) => { const v = get(k, "string"); return v && v !== "wrong" ? bulk(v.value) : nil; }) });
        case "SET": {
            if (arity(2, false)) return done(arity(2, false)!);
            const ex = a.findIndex((x) => x.toUpperCase() === "EX");
            const px = a.findIndex((x) => x.toUpperCase() === "PX");
            const nx = a.some((x) => x.toUpperCase() === "NX");
            if (nx && db[a[0]]) return done(nil);
            const ttl = ex > 0 ? Number(a[ex + 1]) * 1000 : px > 0 ? Number(a[px + 1]) : null;
            db[a[0]] = { data: { type: "string", value: a[1] }, expiresAt: ttl ? Date.now() + ttl : null };
            return done(OK);
        }
        case "APPEND": {
            const v = make(a[0], "string");
            if (v === "wrong") return done(WRONGTYPE);
            v.value += a[1] ?? "";
            return done(int(v.value.length));
        }
        case "STRLEN": { const v = get(a[0], "string"); return done(v === "wrong" ? WRONGTYPE : int(v?.value.length ?? 0)); }
        case "INCR": case "DECR": case "INCRBY": case "DECRBY": {
            const v = make(a[0], "string");
            if (v === "wrong") return done(WRONGTYPE);
            const by = cmd.endsWith("BY") ? Number(a[1]) : 1;
            const n = Number(v.value || "0");
            if (!Number.isInteger(n) || !Number.isInteger(by)) return done(err("ERR value is not an integer or out of range"));
            v.value = String(n + (cmd.startsWith("DECR") ? -by : by));
            return done(int(Number(v.value)));
        }

        case "HSET": {
            if (a.length < 3 || a.length % 2 === 0) return done(err("ERR wrong number of arguments for 'hset' command"));
            const v = make(a[0], "hash");
            if (v === "wrong") return done(WRONGTYPE);
            let added = 0;
            for (let i = 1; i < a.length; i += 2) {
                const at = v.value.findIndex(([f]) => f === a[i]);
                if (at >= 0) v.value[at] = [a[i], a[i + 1]]; else { v.value.push([a[i], a[i + 1]]); added++; }
            }
            return done(int(added));
        }
        case "HGET": { const v = get(a[0], "hash"); return done(v === "wrong" ? WRONGTYPE : bulkOrNil(v?.value.find(([f]) => f === a[1])?.[1])); }
        case "HGETALL": { const v = get(a[0], "hash"); return done(v === "wrong" ? WRONGTYPE : array((v?.value ?? []).flat())); }
        case "HKEYS": { const v = get(a[0], "hash"); return done(v === "wrong" ? WRONGTYPE : array((v?.value ?? []).map(([f]) => f))); }
        case "HLEN": { const v = get(a[0], "hash"); return done(v === "wrong" ? WRONGTYPE : int(v?.value.length ?? 0)); }
        case "HDEL": {
            const v = get(a[0], "hash");
            if (v === "wrong") return done(WRONGTYPE);
            if (!v) return done(int(0));
            const before = v.value.length;
            v.value = v.value.filter(([f]) => !a.slice(1).includes(f));
            if (!v.value.length) delete db[a[0]];
            return done(int(before - v.value.length));
        }

        case "LPUSH": case "RPUSH": {
            if (arity(2, false)) return done(arity(2, false)!);
            const v = make(a[0], "list");
            if (v === "wrong") return done(WRONGTYPE);
            for (const x of a.slice(1)) cmd === "LPUSH" ? v.value.unshift(x) : v.value.push(x);
            return done(int(v.value.length));
        }
        case "LPOP": case "RPOP": {
            const v = get(a[0], "list");
            if (v === "wrong") return done(WRONGTYPE);
            const x = v ? (cmd === "LPOP" ? v.value.shift() : v.value.pop()) : undefined;
            if (v && !v.value.length) delete db[a[0]];
            return done(bulkOrNil(x));
        }
        case "LLEN": { const v = get(a[0], "list"); return done(v === "wrong" ? WRONGTYPE : int(v?.value.length ?? 0)); }
        case "LRANGE": {
            if (arity(3)) return done(arity(3)!);
            const v = get(a[0], "list");
            if (v === "wrong") return done(WRONGTYPE);
            return done(array(range(v?.value ?? [], Number(a[1]), Number(a[2]))));
        }

        case "SADD": {
            if (arity(2, false)) return done(arity(2, false)!);
            const v = make(a[0], "set");
            if (v === "wrong") return done(WRONGTYPE);
            let added = 0;
            for (const x of a.slice(1)) if (!v.value.includes(x)) { v.value.push(x); added++; }
            return done(int(added));
        }
        case "SREM": {
            const v = get(a[0], "set");
            if (v === "wrong") return done(WRONGTYPE);
            if (!v) return done(int(0));
            const before = v.value.length;
            v.value = v.value.filter((x) => !a.slice(1).includes(x));
            if (!v.value.length) delete db[a[0]];
            return done(int(before - v.value.length));
        }
        case "SMEMBERS": { const v = get(a[0], "set"); return done(v === "wrong" ? WRONGTYPE : array(v?.value ?? [])); }
        case "SCARD": { const v = get(a[0], "set"); return done(v === "wrong" ? WRONGTYPE : int(v?.value.length ?? 0)); }
        case "SISMEMBER": { const v = get(a[0], "set"); return done(v === "wrong" ? WRONGTYPE : int(v?.value.includes(a[1]) ? 1 : 0)); }

        case "ZADD": {
            if (a.length < 3 || a.length % 2 === 0) return done(err("ERR syntax error"));
            const v = make(a[0], "zset");
            if (v === "wrong") return done(WRONGTYPE);
            let added = 0;
            for (let i = 1; i < a.length; i += 2) {
                const score = Number(a[i]);
                if (Number.isNaN(score)) return done(err("ERR value is not a valid float"));
                const at = v.value.findIndex(([m]) => m === a[i + 1]);
                if (at >= 0) v.value[at] = [a[i + 1], score]; else { v.value.push([a[i + 1], score]); added++; }
            }
            v.value.sort((x, y) => y[1] - x[1]);
            return done(int(added));
        }
        case "ZINCRBY": {
            const v = make(a[0], "zset");
            if (v === "wrong") return done(WRONGTYPE);
            const at = v.value.findIndex(([m]) => m === a[2]);
            const score = (at >= 0 ? v.value[at][1] : 0) + Number(a[1]);
            if (at >= 0) v.value[at] = [a[2], score]; else v.value.push([a[2], score]);
            v.value.sort((x, y) => y[1] - x[1]);
            return done(bulk(String(score)));
        }
        case "ZSCORE": { const v = get(a[0], "zset"); return done(v === "wrong" ? WRONGTYPE : bulkOrNil(v?.value.find(([m]) => m === a[1])?.[1]?.toString())); }
        case "ZCARD": { const v = get(a[0], "zset"); return done(v === "wrong" ? WRONGTYPE : int(v?.value.length ?? 0)); }
        case "ZRANGE": case "ZREVRANGE": {
            if (arity(3, false)) return done(arity(3, false)!);
            const v = get(a[0], "zset");
            if (v === "wrong") return done(WRONGTYPE);
            const ascending = [...(v?.value ?? [])].sort((x, y) => x[1] - y[1]);
            const sorted = cmd === "ZREVRANGE" || a.some((x) => x.toUpperCase() === "REV") ? ascending.reverse() : ascending;
            const picked = range(sorted, Number(a[1]), Number(a[2]));
            const scores = a.some((x) => x.toUpperCase() === "WITHSCORES");
            return done(array(picked.flatMap(([m, s]) => (scores ? [m, String(s)] : [m]))));
        }

        case "XADD": {
            if (a.length < 4 || a.length % 2 !== 0) return done(err("ERR wrong number of arguments for 'xadd' command"));
            const v = make(a[0], "stream");
            if (v === "wrong") return done(WRONGTYPE);
            const id = a[1] === "*" ? `${Date.now()}-0` : a[1];
            const fields: [string, string][] = [];
            for (let i = 2; i < a.length; i += 2) fields.push([a[i], a[i + 1]]);
            v.value.push({ id, fields });
            return done(bulk(id));
        }
        case "XLEN": { const v = get(a[0], "stream"); return done(v === "wrong" ? WRONGTYPE : int(v?.value.length ?? 0)); }
        case "XRANGE": {
            const v = get(a[0], "stream");
            if (v === "wrong") return done(WRONGTYPE);
            return done({ array: (v?.value ?? []).map((e) => ({ array: [bulk(e.id), array(e.fields.flat())] })) });
        }
    }
    return done(err(`ERR unknown command '${name}', with args beginning with: ${a.slice(0, 3).map((x) => `'${x}'`).join(" ")}`));
}

function bulkOrNil(s: string | undefined): Reply {
    return s === undefined ? nil : bulk(s);
}

function range<T>(items: T[], start: number, stop: number): T[] {
    const n = items.length;
    const from = start < 0 ? Math.max(0, n + start) : start;
    const to = stop < 0 ? n + stop : Math.min(stop, n - 1);
    return from > to ? [] : items.slice(from, to + 1);
}

/** A reply as redis-cli prints it. */
export function format(reply: Reply, indent = ""): string {
    if ("ok" in reply) return reply.ok;
    if ("error" in reply) return `(error) ${reply.error}`;
    if ("int" in reply) return `(integer) ${reply.int}`;
    if ("bulk" in reply) return reply.bulk === null ? "(nil)" : JSON.stringify(reply.bulk);
    if (!reply.array.length) return "(empty array)";
    const width = String(reply.array.length).length;
    return reply.array
        .map((item, i) => {
            const prefix = `${String(i + 1).padStart(width)}) `;
            const body = format(item, indent + " ".repeat(prefix.length));
            return (i ? indent : "") + prefix + body;
        })
        .join("\n");
}
