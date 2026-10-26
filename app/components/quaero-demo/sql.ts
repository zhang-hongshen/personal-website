import type { Database, Kind, Table, Value } from "./data";
import { distance, parseVector } from "./vector";

// A small SQL interpreter over the demo's tables, enough for the console to feel real: SELECT with
// WHERE, GROUP BY, ORDER BY and LIMIT, the usual aggregates, and INSERT, UPDATE and DELETE. Errors
// read the way each database words them.

export type Result =
    | { kind: "rows"; columns: string[]; rows: Value[][]; ms: number }
    | { kind: "done"; message: string; ms: number }
    | { kind: "error"; message: string; ms: number };

type Token = { t: "id" | "num" | "str" | "op" | "kw"; v: string };

const KEYWORDS = new Set([
    "select", "from", "where", "group", "by", "order", "asc", "desc", "limit", "and", "or", "not", "is", "null", "like", "ilike",
    "in", "as", "insert", "into", "values", "update", "set", "delete", "true", "false", "distinct",
]);

class SQLError extends Error {}

function tokenize(sql: string): Token[] {
    const out: Token[] = [];
    const re = /\s+|--[^\n]*|'((?:[^']|'')*)'|"([^"]+)"|`([^`]+)`|(\d+(?:\.\d+)?)|([A-Za-z_][\w.]*(?:\.\*)?)|(<=>|<->|<#>|<>|!=|<=|>=|[=<>(),*;+\-/.])/gy;
    let m: RegExpExecArray | null;
    let at = 0;
    while (at < sql.length) {
        re.lastIndex = at;
        m = re.exec(sql);
        if (!m) throw new SQLError(`syntax error at or near "${sql.slice(at, at + 8).split(/\s/)[0]}"`);
        at = re.lastIndex;
        if (m[1] !== undefined) out.push({ t: "str", v: m[1].replace(/''/g, "'") });
        else if (m[2] ?? m[3]) out.push({ t: "id", v: (m[2] ?? m[3])! });
        else if (m[4]) out.push({ t: "num", v: m[4] });
        else if (m[5]) out.push(KEYWORDS.has(m[5].toLowerCase()) ? { t: "kw", v: m[5].toLowerCase() } : { t: "id", v: m[5] });
        else if (m[6]) out.push({ t: "op", v: m[6] });
    }
    // "public"."products" is one name.
    for (let i = out.length - 3; i >= 0; i--) {
        if (out[i].t === "id" && out[i + 1].t === "op" && out[i + 1].v === "." && out[i + 2].t === "id") out.splice(i, 3, { t: "id", v: `${out[i].v}.${out[i + 2].v}` });
    }
    return out;
}

type Expr =
    | { e: "col"; name: string }
    | { e: "lit"; value: Value }
    | { e: "agg"; fn: string; arg: Expr | "*" }
    | { e: "fn"; fn: string; args: Expr[] }
    | { e: "bin"; op: string; l: Expr; r: Expr }
    | { e: "not"; x: Expr }
    | { e: "isnull"; x: Expr; not: boolean }
    | { e: "in"; x: Expr; list: Expr[]; not: boolean };

const AGGREGATES = new Set(["count", "sum", "avg", "min", "max"]);

class Parser {
    i = 0;
    constructor(private tokens: Token[]) {}
    peek(v?: string) { const t = this.tokens[this.i]; return v === undefined ? t : t && t.v.toLowerCase() === v ? t : undefined; }
    next() { return this.tokens[this.i++]; }
    accept(v: string) { if (this.peek(v)) { this.i++; return true; } return false; }
    expect(v: string) { if (!this.accept(v)) this.fail(); }
    fail(): never { const t = this.peek(); throw new SQLError(t ? `syntax error at or near "${t.v}"` : "syntax error at end of input"); }
    ident() { const t = this.next(); if (!t || t.t !== "id") { this.i--; this.fail(); } return t.v; }
    done() { return this.i >= this.tokens.length; }

    expr(): Expr { return this.or(); }
    or(): Expr { let l = this.and(); while (this.accept("or")) l = { e: "bin", op: "or", l, r: this.and() }; return l; }
    and(): Expr { let l = this.not(); while (this.accept("and")) l = { e: "bin", op: "and", l, r: this.not() }; return l; }
    not(): Expr { return this.accept("not") ? { e: "not", x: this.not() } : this.compare(); }
    compare(): Expr {
        const l = this.sum();
        if (this.accept("is")) { const not = this.accept("not"); this.expect("null"); return { e: "isnull", x: l, not }; }
        const negated = this.accept("not");
        if (this.accept("in")) {
            this.expect("(");
            const list = [this.expr()];
            while (this.accept(",")) list.push(this.expr());
            this.expect(")");
            return { e: "in", x: l, list, not: negated };
        }
        for (const op of ["like", "ilike"]) if (this.accept(op)) { const r: Expr = { e: "bin", op, l, r: this.sum() }; return negated ? { e: "not", x: r } : r; }
        if (negated) this.fail();
        const t = this.peek();
        if (t?.t === "op" && ["=", "!=", "<>", "<", ">", "<=", ">="].includes(t.v)) { this.i++; return { e: "bin", op: t.v === "<>" ? "!=" : t.v, l, r: this.sum() }; }
        return l;
    }
    sum(): Expr {
        let l = this.atom();
        for (let t = this.peek(); t?.t === "op" && ["+", "-", "*", "/", "<=>", "<->", "<#>"].includes(t.v); t = this.peek()) {
            this.i++;
            l = { e: "bin", op: t.v, l, r: this.atom() };
        }
        return l;
    }
    atom(): Expr {
        const t = this.next();
        if (!t) this.fail();
        if (t.t === "num") return { e: "lit", value: Number(t.v) };
        if (t.t === "str") return { e: "lit", value: t.v };
        if (t.t === "kw" && (t.v === "true" || t.v === "false")) return { e: "lit", value: t.v === "true" };
        if (t.t === "kw" && t.v === "null") return { e: "lit", value: null };
        if (t.t === "op" && t.v === "(") { const x = this.expr(); this.expect(")"); return x; }
        if (t.t === "op" && t.v === "-") { const x = this.atom(); return { e: "bin", op: "-", l: { e: "lit", value: 0 }, r: x }; }
        if (t.t === "id") {
            if (this.accept("(")) {
                const fn = t.v.toLowerCase();
                if (AGGREGATES.has(fn)) {
                    const arg = this.accept("*") ? "*" : (this.accept("distinct"), this.expr());
                    this.expect(")");
                    return { e: "agg", fn, arg };
                }
                const args: Expr[] = [];
                if (!this.accept(")")) { do args.push(this.expr()); while (this.accept(",")); this.expect(")"); }
                return { e: "fn", fn, args };
            }
            return { e: "col", name: t.v };
        }
        this.i--;
        this.fail();
    }
}

type Row = Record<string, Value>;

function compareValues(a: Value, b: Value) {
    if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1;
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b));
}

function like(value: Value, pattern: Value, ignoreCase: boolean) {
    if (value === null || pattern === null) return null;
    const re = new RegExp(`^${String(pattern).replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".")}$`, ignoreCase ? "is" : "s");
    return re.test(String(value));
}

function evaluate(x: Expr, row: Row, group?: Row[], kind?: Kind): Value {
    switch (x.e) {
        case "lit": return x.value;
        case "col": {
            const key = Object.keys(row).find((k) => k.toLowerCase() === x.name.toLowerCase() || k.toLowerCase() === x.name.split(".").pop()!.toLowerCase());
            if (key === undefined) throw new SQLError(kind === "mysql" ? `Unknown column '${x.name}' in 'field list' (1054)` : `column "${x.name}" does not exist`);
            return row[key];
        }
        case "agg": {
            const rows = group ?? [row];
            const values = x.arg === "*" ? rows.map(() => 1) : rows.map((r) => evaluate(x.arg as Expr, r, undefined, kind)).filter((v) => v !== null);
            if (x.fn === "count") return values.length;
            if (!values.length) return null;
            if (x.fn === "min") return values.reduce((a, b) => (compareValues(a, b) <= 0 ? a : b));
            if (x.fn === "max") return values.reduce((a, b) => (compareValues(a, b) >= 0 ? a : b));
            const total = values.reduce((a: number, b) => a + Number(b), 0);
            return Math.round((x.fn === "sum" ? total : total / values.length) * 100) / 100;
        }
        case "fn": {
            const args = x.args.map((a) => evaluate(a, row, group, kind));
            switch (x.fn) {
                case "now": case "current_timestamp": return "2026-10-25 19:30:00+00";
                case "version": return kind === "mysql" ? "8.4.3" : kind === "sqlite" ? "3.46.1" : "PostgreSQL 17.2 on aarch64-apple-darwin";
                case "lower": return args[0] === null ? null : String(args[0]).toLowerCase();
                case "upper": return args[0] === null ? null : String(args[0]).toUpperCase();
                case "length": return args[0] === null ? null : String(args[0]).length;
                case "coalesce": return args.find((a) => a !== null) ?? null;
                case "round": return args[0] === null ? null : Number(Number(args[0]).toFixed(Number(args[1] ?? 0)));
                default: throw new SQLError(kind === "mysql" ? `FUNCTION ${x.fn} does not exist (1305)` : `function ${x.fn}() does not exist`);
            }
        }
        case "not": { const v = evaluate(x.x, row, group, kind); return v === null ? null : !v; }
        case "isnull": { const v = evaluate(x.x, row, group, kind) === null; return x.not ? !v : v; }
        case "in": {
            const v = evaluate(x.x, row, group, kind);
            const hit = x.list.some((i) => compareValues(v, evaluate(i, row, group, kind)) === 0);
            return x.not ? !hit : hit;
        }
        case "bin": {
            if (x.op === "and") return Boolean(evaluate(x.l, row, group, kind)) && Boolean(evaluate(x.r, row, group, kind));
            if (x.op === "or") return Boolean(evaluate(x.l, row, group, kind)) || Boolean(evaluate(x.r, row, group, kind));
            const l = evaluate(x.l, row, group, kind), r = evaluate(x.r, row, group, kind);
            if (x.op === "like" || x.op === "ilike") return like(l, r, x.op === "ilike" || kind === "mysql");
            if (l === null || r === null) return null;
            if (x.op === "<=>" || x.op === "<->" || x.op === "<#>") {
                const a = parseVector(l), b = parseVector(r);
                if (!a || !b) throw new SQLError(`operator does not exist: ${typeof l === "number" ? "numeric" : "text"} ${x.op} ${typeof r === "number" ? "numeric" : "text"}`);
                try { return Math.round(distance(x.op, a, b) * 10000) / 10000; } catch (e) { throw new SQLError((e as Error).message); }
            }
            const c = compareValues(typeof l === "boolean" ? Number(l) : l, typeof r === "boolean" ? Number(r) : r);
            switch (x.op) {
                case "=": return c === 0;
                case "!=": return c !== 0;
                case "<": return c < 0;
                case ">": return c > 0;
                case "<=": return c <= 0;
                case ">=": return c >= 0;
                case "+": return Number(l) + Number(r);
                case "-": return Number(l) - Number(r);
                case "*": return Number(l) * Number(r);
                case "/": return Number(r) === 0 ? null : Number(l) / Number(r);
            }
        }
    }
    return null;
}

const hasAggregate = (x: Expr): boolean =>
    x.e === "agg" || (x.e === "bin" && (hasAggregate(x.l) || hasAggregate(x.r))) || (x.e === "fn" && x.args.some(hasAggregate)) || (x.e === "not" && hasAggregate(x.x));

function label(x: Expr): string {
    if (x.e === "col") return x.name.split(".").pop()!;
    if (x.e === "agg") return x.fn;
    if (x.e === "fn") return x.fn;
    return "?column?";
}

function findTable(db: Database, name: string, kind: Kind): Table {
    const n = name.toLowerCase();
    const table = db.tables.find((t) => t.name.toLowerCase() === n || t.name.split(".").pop()!.toLowerCase() === n);
    if (!table) throw new SQLError(kind === "mysql" ? `Table '${db.name}.${name}' doesn't exist (1146)` : kind === "sqlite" ? `no such table: ${name}` : `relation "${name}" does not exist`);
    return table;
}

const rowsOf = (table: Table): Row[] => table.rows.map((r) => Object.fromEntries(table.columns.map((c, i) => [c.name, r[i]])));

function select(p: Parser, db: Database, kind: Kind): Result & { kind: "rows" } {
    const distinct = p.accept("distinct");
    const items: ({ star: true } | { x: Expr; as?: string })[] = [];
    do {
        if (p.accept("*")) items.push({ star: true });
        else {
            const x = p.expr();
            const as = p.accept("as") ? p.ident() : p.peek()?.t === "id" ? p.ident() : undefined;
            items.push({ x, as });
        }
    } while (p.accept(","));

    let table: Table | undefined;
    if (p.accept("from")) table = findTable(db, p.ident(), kind);
    let rows: Row[] = table ? rowsOf(table) : [{}];
    if (p.accept("where")) {
        const where = p.expr();
        rows = rows.filter((r) => evaluate(where, r, undefined, kind) === true);
    }
    let groups: Row[][] | null = null;
    if (p.accept("group")) {
        p.expect("by");
        const keys: Expr[] = [];
        do {
            const t = p.peek();
            // GROUP BY 1 refers to the first selected column.
            if (t?.t === "num") { p.next(); const item = items[Number(t.v) - 1]; if (!item || "star" in item) p.fail(); keys.push(item.x); } else keys.push(p.expr());
        } while (p.accept(","));
        const map = new Map<string, Row[]>();
        for (const r of rows) {
            const k = JSON.stringify(keys.map((x) => evaluate(x, r, undefined, kind)));
            map.set(k, [...(map.get(k) ?? []), r]);
        }
        groups = [...map.values()];
    } else if (items.some((i) => !("star" in i) && hasAggregate(i.x))) {
        groups = [rows];
    }

    const columns = items.flatMap((i) => ("star" in i ? (table?.columns.map((c) => c.name) ?? []) : [i.as ?? label(i.x)]));
    const source = groups ? groups.map((g) => ({ row: g[0] ?? {}, group: g })) : rows.map((row) => ({ row, group: undefined }));
    let out = source.map(({ row, group }) => items.flatMap((i) => ("star" in i ? table!.columns.map((c) => row[c.name]) : [evaluate(i.x, row, group, kind)])));

    if (p.accept("order")) {
        p.expect("by");
        const keys: { x: Expr | number; desc: boolean }[] = [];
        do {
            const t = p.peek();
            const x: Expr | number = t?.t === "num" ? (p.next(), Number(t.v) - 1) : p.expr();
            keys.push({ x, desc: p.accept("desc") ? true : (p.accept("asc"), false) });
        } while (p.accept(","));
        const indexed = out.map((values, n) => ({ values, n }));
        const valueOf = (k: { x: Expr | number }, v: { values: Value[]; n: number }) => {
            if (typeof k.x === "number") return v.values[k.x];
            const alias = k.x.e === "col" ? columns.findIndex((c) => c.toLowerCase() === (k.x as { name: string }).name.toLowerCase()) : -1;
            if (alias >= 0) return v.values[alias];
            return evaluate(k.x, source[v.n].row, source[v.n].group, kind);
        };
        indexed.sort((a, b) => {
            for (const k of keys) { const c = compareValues(valueOf(k, a), valueOf(k, b)); if (c) return k.desc ? -c : c; }
            return 0;
        });
        out = indexed.map((v) => v.values);
    }
    if (distinct) out = out.filter((r, i) => out.findIndex((o) => JSON.stringify(o) === JSON.stringify(r)) === i);
    if (p.accept("limit")) { const t = p.next(); if (t?.t !== "num") p.fail(); out = out.slice(0, Number(t.v)); }
    return { kind: "rows", columns, rows: out, ms: 0 };
}

/** Runs every statement in `sql` against `db`, changing its tables in place; returns each result. */
export function run(sql: string, db: Database, kind: Kind): Result[] {
    const results: Result[] = [];
    let tokens: Token[];
    const started = performance.now();
    const ms = () => Math.max(1, Math.round(performance.now() - started + 2 + Math.random() * 10));
    try {
        tokens = tokenize(sql);
    } catch (e) {
        return [{ kind: "error", message: errorText(e, kind), ms: ms() }];
    }
    const statements: Token[][] = [[]];
    for (const t of tokens) t.t === "op" && t.v === ";" ? statements.push([]) : statements[statements.length - 1].push(t);
    for (const statement of statements.filter((s) => s.length)) {
        const p = new Parser(statement);
        try {
            const verb = p.next().v.toLowerCase();
            const statementOf: Record<string, (p: Parser, db: Database, kind: Kind) => Result> = { select, insert, update, delete: remove };
            if (!statementOf[verb]) { p.i = 0; p.fail(); }
            const result = statementOf[verb](p, db, kind);
            if (!p.done()) p.fail();
            results.push({ ...result, ms: ms() });
        } catch (e) {
            results.push({ kind: "error", message: errorText(e, kind), ms: ms() });
            break;
        }
    }
    return results;
}

function errorText(e: unknown, kind: Kind) {
    if (!(e instanceof SQLError)) throw e;
    if (kind === "mysql" && e.message.startsWith("syntax error")) {
        return `You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near '${e.message.match(/"(.*)"/)?.[1] ?? ""}' (1064)`;
    }
    if (kind === "sqlite") return e.message.replace(/^syntax error at or near "(.*)"/, 'near "$1": syntax error');
    return `ERROR: ${e.message}`;
}

const affected = (kind: Kind, verb: string, n: number) =>
    kind === "postgresql" ? `${verb.toUpperCase()}${verb === "insert" ? " 0" : ""} ${n}` : `${n} row${n === 1 ? "" : "s"} affected`;

function insert(p: Parser, db: Database, kind: Kind): Result {
    p.expect("into");
    const table = findTable(db, p.ident(), kind);
    if (table.kind === "view") throw new SQLError(`cannot insert into view "${table.name}"`);
    let names = table.columns.map((c) => c.name);
    if (p.accept("(")) { names = []; do names.push(p.ident()); while (p.accept(",")); p.expect(")"); }
    p.expect("values");
    let n = 0;
    do {
        p.expect("(");
        const values: Value[] = [];
        do values.push(evaluate(p.expr(), {}, undefined, kind)); while (p.accept(","));
        p.expect(")");
        if (values.length !== names.length) throw new SQLError("INSERT has more expressions than target columns");
        const key = table.columns.find((c) => c.key);
        table.rows.push(table.columns.map((c) => {
            const at = names.findIndex((x) => x.toLowerCase() === c.name.toLowerCase());
            if (at >= 0) return values[at];
            if (c === key && typeof table.rows[0]?.[table.columns.indexOf(c)] === "number") return Math.max(0, ...table.rows.map((r) => Number(r[table.columns.indexOf(c)]))) + 1;
            if (c.default === "now()" || c.default === "CURRENT_TIMESTAMP") return "2026-10-25 19:30:00";
            if (c.default === "true") return true;
            if (c.default && /^'.*'$/.test(c.default)) return c.default.slice(1, -1);
            if (c.default && /^\d+$/.test(c.default)) return Number(c.default);
            return null;
        }));
        n++;
    } while (p.accept(","));
    return { kind: "done", message: affected(kind, "insert", n), ms: 0 };
}

function update(p: Parser, db: Database, kind: Kind): Result {
    const table = findTable(db, p.ident(), kind);
    p.expect("set");
    const sets: [number, Expr][] = [];
    do {
        const name = p.ident();
        const at = table.columns.findIndex((c) => c.name.toLowerCase() === name.toLowerCase());
        if (at < 0) throw new SQLError(`column "${name}" of relation "${table.name}" does not exist`);
        p.expect("=");
        sets.push([at, p.expr()]);
    } while (p.accept(","));
    const where = p.accept("where") ? p.expr() : null;
    let n = 0;
    const rows = rowsOf(table);
    table.rows = table.rows.map((values, i) => {
        if (where && evaluate(where, rows[i], undefined, kind) !== true) return values;
        n++;
        const next = [...values];
        for (const [at, x] of sets) next[at] = evaluate(x, rows[i], undefined, kind);
        return next;
    });
    return { kind: "done", message: affected(kind, "update", n), ms: 0 };
}

function remove(p: Parser, db: Database, kind: Kind): Result {
    p.expect("from");
    const table = findTable(db, p.ident(), kind);
    const where = p.accept("where") ? p.expr() : null;
    const rows = rowsOf(table);
    const before = table.rows.length;
    table.rows = table.rows.filter((_, i) => where !== null && evaluate(where, rows[i], undefined, kind) !== true);
    return { kind: "done", message: affected(kind, "delete", before - table.rows.length), ms: 0 };
}
