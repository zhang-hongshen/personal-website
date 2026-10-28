import type { L } from "~/components/demo-text";
import type { SymbolName } from "~/components/sf-symbol";

// The connections in the demo and what's on them. Each connection is a tree of folders and files;
// S3's top level is its buckets, as in the app.

export type Protocol = "s3" | "sftp" | "webdav";

export type Item = {
    name: string;
    /** Bytes; folders have none. */
    size?: number;
    /** ISO date. */
    modified: string;
    children?: Item[];
    /** S3 only: the object's Content-Type and Cache-Control. */
    meta?: { type: string; cache: string };
    /** SFTP only: permissions and owner. */
    mode?: string;
    owner?: string;
};

export type Connection = { id: string; name: L; protocol: Protocol; address: string; root: Item };

export const PROTOCOLS: Record<Protocol, { name: string; icon: SymbolName }> = {
    s3: { name: "S3", icon: "shippingbox" },
    sftp: { name: "SFTP", icon: "lock" },
    webdav: { name: "WebDAV", icon: "network" },
};

const MB = 1024 * 1024;

const file = (name: string, size: number, modified: string, extra: Partial<Item> = {}): Item => ({ name, size, modified, ...extra });
const folder = (name: string, modified: string, children: Item[], extra: Partial<Item> = {}): Item => ({ name, modified, children, ...extra });

const s3 = (type: string, cache = "max-age=31536000") => ({ meta: { type, cache } });
const unix = (mode: string, owner = "deploy") => ({ mode, owner });

export function initialConnections(): Connection[] {
    return [
        {
            id: "s3", name: ["Media Storage", "媒体存储", "媒體儲存"], protocol: "s3", address: "s3.us-east-1.amazonaws.com",
            root: folder("/", "2026-10-28", [
                folder("site-assets", "2026-10-26", [
                    folder("images", "2026-10-26", [
                        file("hero.jpg", 2.4 * MB, "2026-10-26T09:14", s3("image/jpeg")),
                        file("hero@2x.jpg", 6.1 * MB, "2026-10-26T09:14", s3("image/jpeg")),
                        file("logo.svg", 18_400, "2026-09-02T16:40", s3("image/svg+xml")),
                        file("team.png", 1.2 * MB, "2026-10-11T11:05", s3("image/png")),
                    ]),
                    folder("fonts", "2026-08-30", [
                        file("Inter.woff2", 312_000, "2026-08-30T10:20", s3("font/woff2")),
                    ]),
                    file("styles.css", 48_200, "2026-10-27T18:02", s3("text/css", "max-age=3600")),
                    file("app.js", 412_000, "2026-10-27T18:02", s3("text/javascript", "max-age=3600")),
                ]),
                folder("backups", "2026-10-28", [
                    file("db-2026-10-26.sql.gz", 184 * MB, "2026-10-26T03:00", s3("application/gzip", "no-cache")),
                    file("db-2026-10-27.sql.gz", 186 * MB, "2026-10-27T03:00", s3("application/gzip", "no-cache")),
                    file("db-2026-10-28.sql.gz", 187 * MB, "2026-10-28T03:00", s3("application/gzip", "no-cache")),
                ]),
                folder("videos", "2026-10-19", [
                    file("product-tour.mp4", 642 * MB, "2026-10-19T14:31", s3("video/mp4")),
                    file("teaser.mov", 98 * MB, "2026-10-12T20:10", s3("video/quicktime")),
                ]),
            ]),
        },
        {
            id: "sftp", name: ["Web Server", "网站服务器", "網站伺服器"], protocol: "sftp", address: "deploy@web.example.com",
            root: folder("/", "2026-10-28", [
                folder("var", "2026-10-20", [
                    folder("www", "2026-10-27", [
                        file("index.html", 9_800, "2026-10-27T18:05", unix("-rw-r--r--")),
                        file("robots.txt", 120, "2026-06-14T08:00", unix("-rw-r--r--")),
                        folder("assets", "2026-10-27", [], unix("drwxr-xr-x")),
                    ], unix("drwxr-xr-x")),
                    folder("log", "2026-10-28", [
                        file("access.log", 23 * MB, "2026-10-28T23:58", unix("-rw-r-----", "www-data")),
                        file("error.log", 410_000, "2026-10-28T21:12", unix("-rw-r-----", "www-data")),
                    ], unix("drwxr-x---", "root")),
                ], unix("drwxr-xr-x", "root")),
                folder("etc", "2026-10-02", [
                    folder("nginx", "2026-10-02", [
                        file("nginx.conf", 2_900, "2026-10-02T13:44", unix("-rw-r--r--", "root")),
                    ], unix("drwxr-xr-x", "root")),
                ], unix("drwxr-xr-x", "root")),
                file("deploy.sh", 1_400, "2026-09-21T09:30", unix("-rwxr-xr-x")),
            ], unix("drwxr-xr-x", "root")),
        },
        {
            id: "webdav", name: ["Team Files", "团队文件", "團隊檔案"], protocol: "webdav", address: "cloud.example.com",
            root: folder("/", "2026-10-28", [
                folder("Design", "2026-10-25", [
                    file("Homepage.fig", 38 * MB, "2026-10-25T17:22"),
                    file("Icons.sketch", 12 * MB, "2026-10-03T10:41"),
                ]),
                folder("Contracts", "2026-09-30", [
                    file("Agreement 2026.pdf", 840_000, "2026-09-30T15:00"),
                ]),
                file("Meeting notes.md", 6_200, "2026-10-28T10:15"),
                file("Roadmap.key", 24 * MB, "2026-10-22T19:48"),
            ]),
        },
    ];
}

/** Files that the Upload button "picks" in turn, as if from the Mac. */
export const UPLOADS: Item[] = [
    file("launch-banner.png", 3.8 * MB, "2026-10-29T09:00"),
    file("release-notes.pdf", 1.1 * MB, "2026-10-29T09:00"),
    file("demo-video.mp4", 220 * MB, "2026-10-29T09:00"),
];

const KINDS: [RegExp, L][] = [
    [/\.(jpe?g|png|heic)$/i, ["Image", "图像", "影像"]],
    [/\.svg$/i, ["SVG image", "SVG 图像", "SVG 影像"]],
    [/\.(mp4|mov)$/i, ["Movie", "影片", "影片"]],
    [/\.pdf$/i, ["PDF document", "PDF 文稿", "PDF 文件"]],
    [/\.(gz|zip)$/i, ["Archive", "归档", "封存檔"]],
    [/\.(css|js|html|sh|conf|md|txt|log)$/i, ["Text", "文本", "文字"]],
    [/\.woff2$/i, ["Font", "字体", "字體"]],
];

export function kindOf(item: Item): L {
    if (item.children) return ["Folder", "文件夹", "檔案夾"];
    return KINDS.find(([re]) => re.test(item.name))?.[1] ?? ["Document", "文稿", "文件"];
}

export function iconOf(item: Item): SymbolName {
    if (item.children) return "folder";
    if (/\.(mp4|mov)$/i.test(item.name)) return "film";
    if (/\.(css|js|html|sh|conf|md|txt|log)$/i.test(item.name)) return "doc.text";
    return "doc";
}

export function formatSize(bytes: number): string {
    if (bytes < 1000) return `${bytes} bytes`;
    const units = ["KB", "MB", "GB"];
    let value = bytes / 1000;
    let unit = 0;
    while (value >= 1000 && unit < units.length - 1) { value /= 1000; unit++; }
    return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

/** The folder at `path` (names from the root), or undefined if it's gone. */
export function folderAt(root: Item, path: string[]): Item | undefined {
    let at: Item | undefined = root;
    for (const name of path) at = at?.children?.find((c) => c.name === name);
    return at?.children ? at : undefined;
}

/** A name that isn't taken in `folder`: "name", then "name 2", "name 3"… */
export function freeName(folder: Item, name: string): string {
    const taken = new Set(folder.children?.map((c) => c.name));
    if (!taken.has(name)) return name;
    const dot = name.lastIndexOf(".");
    const [base, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""];
    for (let n = 2; ; n++) if (!taken.has(`${base} ${n}${ext}`)) return `${base} ${n}${ext}`;
}

/** Deep copy, so a copied item never shares children with its source. */
export function clone(item: Item): Item {
    return { ...item, children: item.children?.map(clone) };
}

export function totalSize(item: Item): number {
    return item.children ? item.children.reduce((sum, c) => sum + totalSize(c), 0) : item.size ?? 0;
}
