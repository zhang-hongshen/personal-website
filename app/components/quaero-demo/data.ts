import { embedding } from "./vector";

// What the Quaero demo connects to: a PostgreSQL shop (with a pgvector column), a MySQL analytics
// database, a SQLite file, and the vector databases Qdrant and Milvus, each a few small tables or
// collections held in the page. Vectors are 48-dimensional and grouped by topic, so similar items
// really are near each other.

export type Kind = "postgresql" | "mysql" | "sqlite" | "qdrant" | "milvus";
export type Value = string | number | boolean | null;
export type Column = { name: string; type: string; nullable: boolean; default?: string; key?: boolean; comment?: string };
export type Table = { name: string; kind: "table" | "view" | "collection"; comment?: string; columns: Column[]; rows: Value[][]; /** A collection's configuration, shown where SQL tables show CREATE. */ config?: unknown; /** CREATE INDEX statements, appended to CREATE. */ indexes?: string[] };
export type Database = { name: string; tables: Table[] };
export type Connection = { id: string; name: string; kind: Kind; summary: string; databases: Database[] };

export const KIND_NAME: Record<Kind, string> = { postgresql: "PostgreSQL", mysql: "MySQL", sqlite: "SQLite", qdrant: "Qdrant", milvus: "Milvus" };

/** Vector databases take REST requests in the console instead of SQL. */
export const isVectorDB = (kind: Kind) => kind === "qdrant" || kind === "milvus";

const DIMS = 48;

const col = (name: string, type: string, extra: Partial<Column> = {}): Column => ({ name, type, nullable: false, ...extra });

const customers: Table = {
    name: "public.customers", kind: "table", comment: "People who placed at least one order",
    columns: [
        col("id", "integer", { key: true, default: "nextval('customers_id_seq')" }),
        col("name", "text"),
        col("email", "text"),
        col("city", "text", { nullable: true }),
        col("created_at", "timestamp with time zone", { default: "now()" }),
    ],
    rows: [
        [1, "Maya Chen", "maya@example.com", "San Francisco", "2026-01-04 09:12:00+00"],
        [2, "Leo Fischer", "leo@example.com", "Berlin", "2026-01-19 16:40:00+00"],
        [3, "Priya Raman", "priya@example.com", "Bangalore", "2026-02-02 11:05:00+00"],
        [4, "Sam Okafor", "sam@example.com", null, "2026-02-27 08:30:00+00"],
        [5, "Hana Sato", "hana@example.com", "Tokyo", "2026-03-14 21:18:00+00"],
        [6, "Lucas Moreau", "lucas@example.com", "Lyon", "2026-04-08 13:55:00+00"],
        [7, "Aiko Tanaka", "aiko@example.com", "Osaka", "2026-05-21 07:42:00+00"],
        [8, "Noah Williams", "noah@example.com", null, "2026-06-30 19:03:00+00"],
    ],
};

const products: Table = {
    name: "public.products", kind: "table",
    columns: [
        col("id", "integer", { key: true, default: "nextval('products_id_seq')" }),
        col("name", "text"),
        col("price", "numeric(8,2)"),
        col("in_stock", "boolean", { default: "true" }),
        col("embedding", `vector(${DIMS})`, { nullable: true, comment: "Description embedding" }),
    ],
    rows: [
        [1, "Film Presets Pack", 4.99, true, embedding(0, 1, DIMS)],
        [2, "Portrait Presets", 2.99, true, embedding(4, 2, DIMS)],
        [3, "Night City Looks", 9.99, true, embedding(5, 3, DIMS)],
        [4, "Black & White Classics", 2.99, false, embedding(0, 4, DIMS)],
        [5, "Pro Bundle", 19.99, true, embedding(0, 5, DIMS)],
        [6, "Neon Nights", 4.99, true, embedding(5, 6, DIMS)],
        [7, "Soft Skin Tones", 2.99, true, embedding(4, 7, DIMS)],
    ],
    indexes: ["CREATE INDEX products_embedding_idx ON public.products USING hnsw (embedding vector_cosine_ops);"],
};

const orders: Table = {
    name: "public.orders", kind: "table", comment: "One row per checkout",
    columns: [
        col("id", "integer", { key: true, default: "nextval('orders_id_seq')" }),
        col("customer_id", "integer", { comment: "References customers.id" }),
        col("product_id", "integer"),
        col("status", "text", { default: "'pending'" }),
        col("total", "numeric(8,2)"),
        col("ordered_at", "timestamp with time zone", { default: "now()" }),
    ],
    rows: [
        [1001, 1, 5, "paid", 19.99, "2026-09-02 10:14:00+00"],
        [1002, 3, 1, "paid", 4.99, "2026-09-03 18:22:00+00"],
        [1003, 2, 3, "refunded", 9.99, "2026-09-05 09:47:00+00"],
        [1004, 5, 2, "paid", 2.99, "2026-09-08 22:31:00+00"],
        [1005, 4, 1, "pending", 4.99, "2026-09-11 14:02:00+00"],
        [1006, 6, 5, "paid", 19.99, "2026-09-15 08:56:00+00"],
        [1007, 1, 3, "paid", 9.99, "2026-09-20 17:40:00+00"],
        [1008, 7, 2, "pending", 2.99, "2026-09-24 12:11:00+00"],
        [1009, 8, 1, "paid", 4.99, "2026-10-01 20:05:00+00"],
        [1010, 3, 5, "paid", 19.99, "2026-10-06 11:38:00+00"],
        [1011, 5, 3, "paid", 9.99, "2026-10-12 15:27:00+00"],
        [1012, 2, 2, "refunded", 2.99, "2026-10-18 09:09:00+00"],
    ],
};

const orderTotals: Table = {
    name: "public.order_totals", kind: "view", comment: "Paid revenue by customer",
    columns: [col("customer_id", "integer", { nullable: true }), col("orders", "bigint", { nullable: true }), col("revenue", "numeric", { nullable: true })],
    rows: [[1, 2, 29.98], [3, 2, 24.98], [5, 2, 12.98], [6, 1, 19.99], [8, 1, 4.99]],
};

const events: Table = {
    name: "events", kind: "table", comment: "Raw app events",
    columns: [
        col("id", "bigint unsigned", { key: true, default: "auto_increment" }),
        col("user_id", "int"),
        col("name", "varchar(64)"),
        col("platform", "enum('macOS','iOS')"),
        col("created_at", "datetime", { default: "CURRENT_TIMESTAMP" }),
    ],
    rows: [
        [1, 42, "app_open", "macOS", "2026-10-24 08:01:12"],
        [2, 42, "export", "macOS", "2026-10-24 08:05:47"],
        [3, 17, "app_open", "iOS", "2026-10-24 09:12:03"],
        [4, 17, "preset_buy", "iOS", "2026-10-24 09:14:55"],
        [5, 88, "app_open", "macOS", "2026-10-24 10:30:21"],
        [6, 42, "app_open", "iOS", "2026-10-24 12:44:09"],
        [7, 88, "export", "macOS", "2026-10-24 13:02:38"],
        [8, 5, "app_open", "macOS", "2026-10-24 15:20:16"],
    ],
};

const sessions: Table = {
    name: "sessions", kind: "table",
    columns: [col("id", "char(8)", { key: true }), col("user_id", "int"), col("seconds", "int"), col("crashed", "tinyint(1)", { default: "0" })],
    rows: [["a91f2c0e", 42, 312, 0], ["b07d33a1", 17, 95, 0], ["c4e8a9f2", 88, 1240, 0], ["d1a2b3c4", 5, 48, 1], ["e9f8a7b6", 42, 660, 0]],
};

const notes: Table = {
    name: "notes", kind: "table",
    columns: [col("id", "INTEGER", { key: true }), col("title", "TEXT"), col("body", "TEXT", { nullable: true }), col("pinned", "INTEGER", { default: "0" })],
    rows: [[1, "Groceries", "Eggs, rice, miso", 1], [2, "Book ideas", null, 0], [3, "Trip to Kyoto", "Fushimi Inari before 8am", 1], [4, "Gift for Hana", "Film camera?", 0]],
};

const tags: Table = {
    name: "tags", kind: "table",
    columns: [col("note_id", "INTEGER"), col("tag", "TEXT")],
    rows: [[1, "home"], [3, "travel"], [3, "japan"], [4, "people"]],
};

const ARTICLES: [string, number, string, string, number][] = [
    ["Shooting film at night", 5, "en", "2026-09-14", 4810],
    ["Night street photography", 5, "en", "2026-08-02", 3922],
    ["霓虹与长曝光", 5, "zh", "2026-07-21", 2150],
    ["Pushing Portra 400 two stops", 0, "en", "2026-10-03", 6120],
    ["Developing black and white at home", 0, "en", "2026-06-18", 2875],
    ["Choosing a 35mm lens", 0, "en", "2026-05-09", 5304],
    ["Five days in Kyoto on foot", 1, "en", "2026-10-11", 7012],
    ["清晨的伏见稻荷", 1, "zh", "2026-09-27", 3388],
    ["A rail pass guide for Japan", 1, "en", "2026-04-30", 4471],
    ["Miso ramen at home", 2, "en", "2026-08-25", 2961],
    ["The best bakeries in Lyon", 2, "en", "2026-03-15", 1840],
    ["大阪的街头小吃", 2, "zh", "2026-07-04", 2607],
];
const ids = ["a91f2c0e", "c4e8a9f2", "e9f8a7b6", "b07d33a1", "d1a2b3c4", "f30c9e17", "1b6d0a42", "5e7f2c88", "8a3d4f10", "2c9b7e55", "7d4e1a93", "9f0c6b21"];

const articles: Table = {
    name: "articles", kind: "collection",
    columns: [
        col("id", "uuid", { key: true }),
        col("vector", `vector(${DIMS}, Cosine)`),
        col("lang", "keyword", { nullable: true, comment: "Indexed" }),
        col("published", "datetime", { nullable: true }),
        col("title", "text", { nullable: true, comment: "Indexed" }),
        col("views", "integer", { nullable: true }),
    ],
    rows: ARTICLES.map(([title, topic, lang, published, views], i) => [ids[i], embedding(topic, 100 + i, DIMS), lang, published, title, views]),
    config: {
        params: { vectors: { size: DIMS, distance: "Cosine" }, shard_number: 1, replication_factor: 1, on_disk_payload: true },
        hnsw_config: { m: 16, ef_construct: 100, full_scan_threshold: 10000 },
        optimizer_config: { indexing_threshold: 20000, flush_interval_sec: 5 },
        payload_schema: { lang: { data_type: "keyword" }, title: { data_type: "text" } },
    },
};

const IMAGES: [string, number, number, number][] = [
    ["Neon sign above a ramen bar", 5, 1600, 1067], ["Rainy crossing at night", 5, 1920, 1280], ["Taxi lights on a wet street", 5, 1600, 1200],
    ["Contact sheet of a portrait session", 0, 2400, 1800], ["Film canisters on a desk", 0, 1600, 1600],
    ["Torii gates in morning light", 1, 1280, 1920], ["Bamboo grove path", 1, 1280, 1920], ["Shinkansen at the platform", 1, 1920, 1080],
    ["Croissants cooling on a rack", 2, 1600, 1067], ["Takoyaki stall in Dotonbori", 2, 1920, 1280],
];
const images: Table = {
    name: "images", kind: "collection", comment: "Photo search",
    columns: [
        col("id", "Int64", { key: true }),
        col("embedding", `FloatVector(${DIMS}, COSINE)`, { comment: "CLIP image embedding" }),
        col("caption", "VarChar(256)", { nullable: true }),
        col("width", "Int32"),
        col("height", "Int32"),
    ],
    rows: IMAGES.map(([caption, topic, w, h], i) => [460_000_001 + i, embedding(topic, 200 + i, DIMS), caption, w, h]),
    config: {
        collectionName: "images", description: "Photo search", autoId: false, consistencyLevel: "Bounded", load: "LoadStateLoaded",
        fields: [
            { name: "id", type: "Int64", primaryKey: true },
            { name: "embedding", type: "FloatVector", params: [{ key: "dim", value: String(DIMS) }] },
            { name: "caption", type: "VarChar", params: [{ key: "max_length", value: "256" }] },
            { name: "width", type: "Int32" }, { name: "height", type: "Int32" },
        ],
        indexes: [{ fieldName: "embedding", indexName: "embedding_hnsw", metricType: "COSINE" }],
    },
};

export const CONNECTIONS: Connection[] = [
    {
        id: "shop", name: "shop", kind: "postgresql", summary: "postgres@localhost:5432",
        databases: [{ name: "shop", tables: [customers, orders, products, orderTotals] }, { name: "postgres", tables: [] }],
    },
    {
        id: "analytics", name: "analytics", kind: "mysql", summary: "root@127.0.0.1:3306",
        databases: [{ name: "analytics", tables: [events, sessions] }, { name: "mysql", tables: [] }],
    },
    {
        id: "notes", name: "notes.sqlite", kind: "sqlite", summary: "notes.sqlite",
        databases: [{ name: "main", tables: [notes, tags] }],
    },
    {
        id: "vectors", name: "vectors", kind: "qdrant", summary: "localhost:6333",
        databases: [{ name: "localhost:6333", tables: [articles] }],
    },
    {
        id: "search", name: "search", kind: "milvus", summary: "root@localhost:19530",
        databases: [{ name: "default", tables: [images] }, { name: "staging", tables: [] }],
    },
];

/** What "+" adds, in place of the app's connection editor. */
export const NEW_CONNECTION: Connection = {
    id: "staging", name: "staging", kind: "postgresql", summary: "app@staging.internal:5432",
    databases: [{ name: "shop", tables: [structuredClone(customers), structuredClone(orders), structuredClone(products)] }],
};

/** The console's first statement for each kind. */
export const SAMPLE_SQL: Record<Kind, string> = {
    postgresql: "SELECT status, count(*), sum(total)\nFROM orders\nGROUP BY status\nORDER BY count DESC;",
    mysql: "SELECT name, count(*) AS events\nFROM events\nGROUP BY name\nORDER BY events DESC;",
    sqlite: "SELECT title FROM notes WHERE pinned = 1;",
    qdrant: "// A request line, then an optional JSON body\nPOST /collections/articles/points/scroll\n{\"limit\": 5, \"filter\": {\"must\": [{\"key\": \"lang\", \"match\": {\"value\": \"en\"}}]}}",
    milvus: "POST /v2/vectordb/entities/query\n{\"collectionName\": \"images\", \"filter\": \"width >= 1600\", \"limit\": 10, \"outputFields\": [\"id\", \"caption\", \"width\"]}",
};

/** The CREATE statement the Table Info inspector shows, built from the columns as each database prints it. */
export function createStatement(kind: Kind, table: Table): string {
    if (table.config) return JSON.stringify(table.config, null, 2);
    if (table.kind === "view") return `CREATE VIEW ${table.name} AS\n  SELECT customer_id, count(*) AS orders, sum(total) AS revenue\n  FROM orders WHERE status = 'paid'\n  GROUP BY customer_id;`;
    const q = (n: string) => (kind === "mysql" ? `\`${n}\`` : n);
    const lines = table.columns.map((c) => {
        const def = c.default && c.default !== "auto_increment" ? ` DEFAULT ${c.default}` : "";
        const auto = c.default === "auto_increment" ? " AUTO_INCREMENT" : "";
        return `  ${q(c.name)} ${c.type}${c.nullable ? "" : " NOT NULL"}${def}${auto}`;
    });
    const key = table.columns.filter((c) => c.key).map((c) => q(c.name));
    if (key.length) lines.push(`  ${kind === "postgresql" ? `CONSTRAINT ${table.name.split(".").pop()}_pkey ` : ""}PRIMARY KEY (${key.join(", ")})`);
    const tail = kind === "mysql" ? ` ENGINE=InnoDB DEFAULT CHARSET=utf8mb4${table.comment ? ` COMMENT='${table.comment}'` : ""};` : ";";
    const comment = kind === "postgresql" && table.comment ? `\n\nCOMMENT ON TABLE ${table.name} IS '${table.comment}';` : "";
    const indexes = table.indexes?.length ? `\n\n${table.indexes.join("\n")}` : "";
    return `CREATE TABLE ${q(table.name)} (\n${lines.join(",\n")}\n)${tail}${indexes}${comment}`;
}
