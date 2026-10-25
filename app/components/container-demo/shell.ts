import { repoName, shortRef, type Container, type Node } from "./data";

// A small sh for the Terminal tab, over the container's own files: the usual commands to look
// around and change files, so the Files tab shows what the shell did.

export type Shell = { cwd: string };

export function resolve(cwd: string, path: string): string {
    const parts = (path.startsWith("/") ? path : `${cwd}/${path}`).split("/").filter(Boolean);
    const out: string[] = [];
    for (const p of parts) p === ".." ? out.pop() : p !== "." && out.push(p);
    return `/${out.join("/")}`;
}

export function find(root: Node, path: string): Node | null {
    let at: Node | undefined = root;
    for (const part of path.split("/").filter(Boolean)) {
        at = at?.dir?.find((n) => n.name === part);
        if (!at) return null;
    }
    return at ?? null;
}

function parent(root: Node, path: string): [Node | null, string] {
    const parts = path.split("/").filter(Boolean);
    const name = parts.pop() ?? "";
    return [find(root, `/${parts.join("/")}`), name];
}

const HELP = "Commands: ls, cd, pwd, cat, echo, touch, mkdir, rm, ps, env, hostname, uname, whoami, date, df, clear, help";

/** Runs one command line; returns its output, or null for `clear`. */
export function run(container: Container, shell: Shell, line: string): string | null {
    const redirect = line.match(/^(.*?)\s*(>>?)\s*(\S+)\s*$/);
    const [command, append, target] = redirect ? [redirect[1], redirect[2] === ">>", redirect[3]] : [line, false, null];
    const args = command.trim().split(/\s+/).filter(Boolean);
    const [name, ...rest] = args;
    const fs = container.fs;
    let out = "";
    switch (name) {
        case undefined: return "";
        case "clear": return null;
        case "help": out = HELP; break;
        case "pwd": out = shell.cwd; break;
        case "whoami": out = "root"; break;
        case "hostname": out = container.name; break;
        case "uname": out = rest.includes("-a") ? `Linux ${container.name} 6.12.28 #1 SMP aarch64 Linux` : "Linux"; break;
        case "date": out = new Date().toUTCString().replace("GMT", "UTC"); break;
        case "echo": out = rest.join(" ").replace(/^["']|["']$/g, ""); break;
        case "env": out = ["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin", `HOSTNAME=${container.name}`, "HOME=/root"].join("\n"); break;
        case "df": out = `Filesystem     Size  Used Avail Use% Mounted on\n/dev/vda       8.0G  ${repoName(container.image) === "postgres" ? "1.4G" : "212M"}  7.6G   6% /`; break;
        case "ps": {
            const main = { nginx: "nginx: master process nginx -g daemon off;", postgres: "postgres", redis: "redis-server *:6379" }[repoName(container.image)] ?? shortRef(container.image);
            out = `PID   USER     TIME  COMMAND\n    1 root      0:00 ${main}\n   42 root      0:00 /bin/sh\n   57 root      0:00 ps`;
            break;
        }
        case "cd": {
            const path = resolve(shell.cwd, rest[0] ?? "/root");
            const node = find(fs, path);
            if (!node) return `sh: cd: can't cd to ${rest[0]}: No such file or directory`;
            if (!node.dir) return `sh: cd: can't cd to ${rest[0]}: Not a directory`;
            shell.cwd = path;
            return "";
        }
        case "ls": {
            const all = rest.some((a) => a.startsWith("-") && a.includes("a"));
            const long = rest.some((a) => a.startsWith("-") && a.includes("l"));
            const path = resolve(shell.cwd, rest.find((a) => !a.startsWith("-")) ?? ".");
            const node = find(fs, path);
            if (!node) return `ls: ${path}: No such file or directory`;
            const items = node.dir ? node.dir.filter((n) => all || !n.name.startsWith(".")) : [node];
            out = long
                ? items.map((n) => `${n.dir ? "drwxr-xr-x" : "-rw-r--r--"}    1 root     root  ${String(n.file?.length ?? 4096).padStart(8)} Oct 25 19:30 ${n.name}`).join("\n")
                : items.map((n) => (n.dir ? `${n.name}/` : n.name)).join("  ");
            break;
        }
        case "cat": {
            const outs: string[] = [];
            for (const p of rest) {
                const node = find(fs, resolve(shell.cwd, p));
                if (!node) return `cat: can't open '${p}': No such file or directory`;
                if (node.dir) return `cat: read error: Is a directory`;
                outs.push(node.file ?? "");
            }
            out = outs.join("").replace(/\n$/, "");
            break;
        }
        case "touch": case "mkdir": {
            for (const p of rest) {
                const [dir, base] = parent(fs, resolve(shell.cwd, p));
                if (!dir?.dir) return `${name}: ${p}: No such file or directory`;
                if (!dir.dir.some((n) => n.name === base)) dir.dir.push(name === "mkdir" ? { name: base, dir: [] } : { name: base, file: "" });
                dir.dir.sort((a, b) => a.name.localeCompare(b.name));
            }
            return "";
        }
        case "rm": {
            const recursive = rest.some((a) => /^-\w*r/.test(a));
            for (const p of rest.filter((a) => !a.startsWith("-"))) {
                const [dir, base] = parent(fs, resolve(shell.cwd, p));
                const node = dir?.dir?.find((n) => n.name === base);
                if (!node) return `rm: can't remove '${p}': No such file or directory`;
                if (node.dir && !recursive) return `rm: '${p}' is a directory`;
                dir!.dir = dir!.dir!.filter((n) => n !== node);
            }
            return "";
        }
        default: return `sh: ${name}: not found`;
    }
    if (target) {
        const [dir, base] = parent(fs, resolve(shell.cwd, target));
        if (!dir?.dir) return `sh: can't create ${target}: nonexistent directory`;
        const existing = dir.dir.find((n) => n.name === base);
        if (existing?.dir) return `sh: can't create ${target}: Is a directory`;
        const text = `${out}\n`;
        if (existing) existing.file = append ? (existing.file ?? "") + text : text;
        else { dir.dir.push({ name: base, file: text }); dir.dir.sort((a, b) => a.name.localeCompare(b.name)); }
        return "";
    }
    return out;
}
