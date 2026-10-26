// What the Container demo starts with: a few local images, containers made from them, networks and
// volumes. Each container has its own small filesystem for the Files tab and the Terminal.

import type { L } from "~/components/demo-text";

export type Status = "new" | "starting" | "running" | "paused" | "stopping" | "stopped";
export type Node = { name: string; dir?: Node[]; file?: string };
export type Image = { ref: string; size: number; digest: string; created: string; ports: number[]; cmd: string; env: string[]; layers: number };
export type Port = { container: number; host: number | null };
export type Mount = { source: string; path: string; readOnly: boolean };
export type Container = {
    id: string; name: string; image: string; status: Status; cpus: number; memory: number; created: string;
    ports: Port[]; mounts: Mount[]; networks: string[]; logs: string[]; fs: Node; cpu: number[]; mem: number[];
};
export type Network = { name: string; mode: "NAT"; subnet: string | null; builtIn?: boolean };
export type Volume = { name: string; size: number; used: number };

export const STATUS: Record<Status, { title: L; color: string }> = {
    new: { title: ["Created", "已创建", "已建立"], color: "#8e8e93" },
    starting: { title: ["Starting", "正在启动", "正在啟動"], color: "#007aff" },
    running: { title: ["Running", "运行中", "執行中"], color: "#34c759" },
    paused: { title: ["Paused", "已暂停", "已暫停"], color: "#ffcc00" },
    stopping: { title: ["Stopping", "正在停止", "正在停止"], color: "#007aff" },
    stopped: { title: ["Stopped", "已停止", "已停止"], color: "#8e8e93" },
};

const GB = 1024 ** 3;
const MB = 1024 ** 2;

export const IMAGES: Image[] = [
    { ref: "docker.io/library/nginx:1.27", size: 72 * MB, digest: "sha256:a484819eb60211f5299034ac80f6a681b06f89e65866ce91f356ed7c72af059c", created: "2026-09-18", ports: [80], cmd: "nginx -g 'daemon off;'", env: ["NGINX_VERSION=1.27.2"], layers: 7 },
    { ref: "docker.io/library/postgres:17", size: 158 * MB, digest: "sha256:4ec37d2a07a0067f176fdcc9d4bb633a5724d2cc4f892c7a2046d054bb6939e5", created: "2026-10-02", ports: [5432], cmd: "postgres", env: ["PG_MAJOR=17", "PGDATA=/var/lib/postgresql/data"], layers: 13 },
    { ref: "docker.io/library/redis:7.4", size: 41 * MB, digest: "sha256:ea96c435dc17b011f54c6a883c3c45e7726242b075de61c6fe40a10ae6ae0f83", created: "2026-09-30", ports: [6379], cmd: "redis-server", env: ["REDIS_VERSION=7.4.1"], layers: 8 },
    { ref: "docker.io/library/alpine:3.20", size: 3.6 * MB, digest: "sha256:beefdbd8a1da6d2915566fde36db9db0b524eb737fc57cd1367effd16dc0d06d", created: "2026-09-06", ports: [], cmd: "/bin/sh", env: [], layers: 1 },
];

/** Images "Pull" can fetch, by reference, with what each turns into once pulled. */
export const PULLABLE: Record<string, Image> = {
    "docker.io/library/node:22-alpine": { ref: "docker.io/library/node:22-alpine", size: 52 * MB, digest: "sha256:96cc8323e25c8cc6ddcb8b965e135cfd57846e8003ec0d7bcec16c5fd5f6d39f", created: "2026-10-14", ports: [], cmd: "node", env: ["NODE_VERSION=22.11.0"], layers: 5 },
    "docker.io/library/mysql:8.4": { ref: "docker.io/library/mysql:8.4", size: 196 * MB, digest: "sha256:0f775a92980b41c87c58f934a204de80431dd4d854a56e3c9ff3327a6bd2c3f2", created: "2026-10-09", ports: [3306, 33060], cmd: "mysqld", env: ["MYSQL_MAJOR=8.4"], layers: 11 },
    "docker.io/grafana/grafana:11.3": { ref: "docker.io/grafana/grafana:11.3", size: 148 * MB, digest: "sha256:1b2c0a1f49f2e2fd35f8a8e0a9e7c41dbf2a7c95f1edc43d8a8b0bc2d8e1e2c4", created: "2026-10-20", ports: [3000], cmd: "grafana server", env: [], layers: 10 },
};

/** "docker.io/library/nginx:1.27" → "nginx:1.27". */
export const shortRef = (ref: string) => ref.replace(/^docker\.io\/(library\/)?/, "");
export const repoName = (ref: string) => shortRef(ref).split(":")[0].split("/").pop()!;

function filesystem(image: string): Node {
    const repo = repoName(image);
    const etc: Node = { name: "etc", dir: [
        { name: "hostname", file: `${repo}\n` },
        { name: "os-release", file: 'NAME="Alpine Linux"\nID=alpine\nVERSION_ID=3.20.3\nPRETTY_NAME="Alpine Linux v3.20"\n' },
        { name: "hosts", file: "127.0.0.1\tlocalhost\n192.168.64.5\t" + repo + "\n" },
    ] };
    const extra: Node[] =
        repo === "nginx" ? [
            { name: "usr", dir: [{ name: "share", dir: [{ name: "nginx", dir: [{ name: "html", dir: [
                { name: "50x.html", file: "<!doctype html>\n<title>Error</title>\n<h1>An error occurred.</h1>\n" },
                { name: "index.html", file: "<!doctype html>\n<title>Welcome to nginx!</title>\n<h1>Welcome to nginx!</h1>\n<p>If you see this page, the nginx web server is working.</p>\n" },
            ] }] }] }] },
            { name: "var", dir: [{ name: "log", dir: [{ name: "nginx", dir: [{ name: "access.log", file: "" }, { name: "error.log", file: "" }] }] }] },
        ]
        : repo === "postgres" ? [{ name: "var", dir: [{ name: "lib", dir: [{ name: "postgresql", dir: [{ name: "data", dir: [
            { name: "PG_VERSION", file: "17\n" }, { name: "postgresql.conf", file: "listen_addresses = '*'\nmax_connections = 100\nshared_buffers = 128MB\n" }, { name: "base", dir: [] },
        ] }] }] }] }]
        : repo === "redis" ? [{ name: "data", dir: [{ name: "dump.rdb", file: "REDIS0011…(binary)\n" }] }, { name: "usr", dir: [{ name: "local", dir: [{ name: "etc", dir: [{ name: "redis.conf", file: "appendonly yes\nmaxmemory 256mb\n" }] }] }] }]
        : [];
    const root: Node = { name: "", dir: [
        { name: "bin", dir: ["sh", "ls", "cat", "echo", "ps"].map((name) => ({ name, file: "(binary)" })) },
        etc,
        { name: "home", dir: [] },
        { name: "root", dir: [{ name: ".ash_history", file: "" }] },
        { name: "tmp", dir: [] },
    ] };
    for (const e of extra) {
        const existing = root.dir!.find((n) => n.name === e.name);
        if (existing) existing.dir!.push(...e.dir!); else root.dir!.push(e);
    }
    root.dir!.sort((a, b) => a.name.localeCompare(b.name));
    return root;
}

/** Log lines an image prints at start, and one it prints from time to time while it runs. */
export function startLogs(image: string, at: Date): string[] {
    const t = (s: number) => new Date(at.getTime() + s * 1000).toISOString().replace("T", " ").slice(0, 19);
    switch (repoName(image)) {
        case "nginx": return [
            `${t(0)} [notice] 1#1: using the "epoll" event method`,
            `${t(0)} [notice] 1#1: nginx/1.27.2`,
            `${t(0)} [notice] 1#1: start worker processes`,
        ];
        case "postgres": return [
            `${t(0)} UTC [1] LOG:  starting PostgreSQL 17.0 on aarch64-unknown-linux-musl`,
            `${t(0)} UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432`,
            `${t(1)} UTC [1] LOG:  database system is ready to accept connections`,
        ];
        case "redis": return [
            `1:C ${t(0)} * oO0OoO0OoO0Oo Redis is starting oO0OoO0OoO0Oo`,
            `1:M ${t(0)} * Server initialized`,
            `1:M ${t(0)} * Ready to accept connections tcp`,
        ];
        default: return [`${t(0)} started ${shortRef(image)}`];
    }
}

export function runningLog(image: string, at: Date): string | null {
    const t = at.toISOString().replace("T", " ").slice(0, 19);
    const ip = `192.168.64.${1 + Math.floor(Math.random() * 3)}`;
    switch (repoName(image)) {
        case "nginx": {
            const path = ["/", "/index.html", "/favicon.ico", "/assets/app.css"][Math.floor(Math.random() * 4)];
            return `${ip} - - [${t}] "GET ${path} HTTP/1.1" ${path === "/favicon.ico" ? 404 : 200} ${200 + Math.floor(Math.random() * 600)} "-" "Mozilla/5.0"`;
        }
        case "postgres": return Math.random() < 0.5 ? `${t} UTC [${40 + Math.floor(Math.random() * 20)}] LOG:  checkpoint complete: wrote ${Math.floor(Math.random() * 40)} buffers` : null;
        case "redis": return Math.random() < 0.3 ? `1:M ${t} * 1 changes in 3600 seconds. Saving...` : null;
        default: return null;
    }
}

let serial = 0;
export function newContainer(image: Image, name: string, at: Date): Container {
    serial++;
    return {
        id: Array.from({ length: 12 }, (_, i) => "0123456789abcdef"[(image.digest.charCodeAt(10 + i) + serial * 7 + i) % 16]).join(""),
        name, image: image.ref, status: "new", cpus: 2, memory: 1 * GB, created: at.toISOString(),
        ports: image.ports.map((p) => ({ container: p, host: p === 80 ? 8080 : p })), mounts: [], networks: ["default"],
        logs: [], fs: filesystem(image.ref), cpu: [], mem: [],
    };
}

export function initial(at: Date) {
    const make = (ref: string, name: string, status: Status, extra: Partial<Container> = {}) => {
        const c = { ...newContainer(IMAGES.find((i) => i.ref === ref)!, name, at), status, ...extra };
        if (status === "running" || status === "stopped") c.logs = startLogs(ref, new Date(at.getTime() - 3_600_000));
        return c;
    };
    return {
        containers: [
            make("docker.io/library/nginx:1.27", "web", "running", { mounts: [{ source: "~/Sites/lumen", path: "/usr/share/nginx/html", readOnly: true }] }),
            make("docker.io/library/postgres:17", "db", "running", { cpus: 4, memory: 2 * GB, mounts: [{ source: "pgdata", path: "/var/lib/postgresql/data", readOnly: false }], networks: ["default", "backend"] }),
            make("docker.io/library/redis:7.4", "cache", "stopped", { memory: 512 * MB, networks: ["backend"] }),
        ],
        networks: [{ name: "default", mode: "NAT", subnet: "192.168.64.0/24", builtIn: true }, { name: "backend", mode: "NAT", subnet: null }] as Network[],
        volumes: [{ name: "pgdata", size: 10 * GB, used: 1.2 * GB }, { name: "redis-data", size: 2 * GB, used: 0.04 * GB }] as Volume[],
    };
}

export function bytes(n: number) {
    if (n >= GB) return `${(n / GB).toFixed(n >= 10 * GB ? 0 : 1)} GB`;
    if (n >= MB) return `${Math.round(n / MB)} MB`;
    return `${Math.round(n / 1024)} KB`;
}
