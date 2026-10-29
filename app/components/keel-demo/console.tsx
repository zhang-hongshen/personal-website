import { useEffect, useRef, useState } from "react";

import { useText } from "~/components/demo-text";
import { MAC, ToolButton } from "~/components/mac-ui";
import { cn } from "~/lib/utils";
import { COMMANDS, DANGEROUS, execute, format, parseLine } from "./redis";
import type { Server } from "./data";

// The command console (ConsoleView): a redis-cli style prompt with history (Up / Down), command
// completion (Tab), and confirmation before commands that delete data.

export type Line = { kind: "input" | "output" | "error" | "note"; text: string };

export function Console({ server, db, lines, onLines, onDb, onChange, onClose }: {
    server: Server;
    db: number;
    lines: Line[];
    onLines: (lines: Line[]) => void;
    onDb: (db: number) => void;
    /** Called after a command that may have changed the keyspace. */
    onChange: () => void;
    onClose: () => void;
}) {
    const s = useText();
    const [text, setText] = useState("");
    const [history, setHistory] = useState<string[]>([]);
    const [cursor, setCursor] = useState<number | null>(null);
    const [pending, setPending] = useState<string | null>(null);
    const output = useRef<HTMLDivElement>(null);
    const prompt = `${server.address}${db ? `[${db}]` : ""}>`;

    useEffect(() => {
        output.current?.scrollTo({ top: output.current.scrollHeight });
    }, [lines.length]);

    const word = text.trimStart().split(/\s+/)[0]?.toUpperCase() ?? "";
    const suggestions = word && !text.includes(" ") ? COMMANDS.filter((c) => c.startsWith(word) && c !== word).slice(0, 6) : [];

    const run = () => {
        const line = text.trim();
        if (!line) return;
        setText("");
        setCursor(null);
        setHistory((h) => [...h.filter((x) => x !== line), line]);
        const args = parseLine(line);
        const name = args[0]?.toUpperCase() ?? "";
        const echo: Line = { kind: "input", text: `${prompt} ${line}` };
        if (DANGEROUS.has(name) && pending !== line) {
            setPending(line);
            onLines([...lines, echo, { kind: "note", text: s([`${name} deletes every key in db${db}. Run it again to confirm.`, `${name} 会删除 db${db} 中的所有 Key。再运行一次以确认。`, `${name} 會刪除 db${db} 中的所有 Key。再執行一次以確認。`]) }]);
            return;
        }
        setPending(null);
        const { reply, db: next } = execute(server, db, args);
        onLines([...lines, echo, { kind: "error" in reply ? "error" : "output", text: format(reply) }]);
        if (next !== db) onDb(next);
        onChange();
    };

    return (
        <>
            <header className="flex h-[52px] shrink-0 items-center gap-2 px-3">
                <h4 className="mr-auto truncate text-[13px] font-semibold">{s(["Console", "控制台", "主控台"])}</h4>
                <button type="button" className={cn("h-7 rounded-full px-3 text-[12px]", MAC.field)} onClick={() => onLines([])}>{s(["Clear", "清除", "清除"])}</button>
            </header>
            <div ref={output} className="min-h-0 flex-1 overflow-y-auto px-3 pb-2 font-mono text-[11.5px] leading-[1.55] select-text">
                {lines.length === 0 && (
                    <p className={MAC.muted}>
                        {s(["Type a command, e.g. ", "输入命令，例如 ", "輸入指令，例如 "])}<span className="text-current">HGETALL user:1001</span>
                        {s([" or ", " 或 ", " 或 "])}<span className="text-current">SET greeting hello EX 30</span>{s([".", "。", "。"])}
                    </p>
                )}
                {lines.map((l, i) => (
                    <pre
                        key={i}
                        className={cn(
                            "whitespace-pre-wrap break-all",
                            l.kind === "input" && cn("mt-1.5 font-semibold", MAC.muted),
                            l.kind === "error" && "text-[#d70015] dark:text-[#ff6961]",
                            l.kind === "note" && "text-[#c93400] dark:text-[#ff9f0a]",
                        )}
                    >
                        {l.text}
                    </pre>
                ))}
            </div>
            <div className={cn("relative border-t p-2", MAC.line)}>
                {suggestions.length > 0 && (
                    <div className={cn("absolute right-2 bottom-full left-2 mb-1 flex flex-wrap gap-1 rounded-lg border p-1 shadow-sm", MAC.line, MAC.window)} aria-label={s(["Suggestions", "建议", "建議"])}>
                        {suggestions.map((c) => (
                            <button key={c} type="button" className="rounded-md px-1.5 py-0.5 font-mono text-[11px] hover:bg-[#007aff] hover:text-white" onClick={() => setText(`${c} `)}>{c}</button>
                        ))}
                    </div>
                )}
                <label className={cn("flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-mono text-[11.5px]", MAC.field)}>
                    <span className={cn("shrink-0", MAC.muted)}>{prompt}</span>
                    <input
                        value={text}
                        aria-label={s(["Command", "命令", "指令"])}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoCorrect="off"
                        className="min-w-0 flex-1 bg-transparent outline-none"
                        onChange={(e) => { setText(e.target.value); setCursor(null); }}
                        onKeyDown={(e) => {
                            if (e.nativeEvent.isComposing) return;
                            if (e.key === "Enter") { e.preventDefault(); run(); }
                            if (e.key === "Tab" && suggestions[0]) { e.preventDefault(); setText(`${suggestions[0]} `); }
                            if ((e.key === "ArrowUp" || e.key === "ArrowDown") && history.length) {
                                e.preventDefault();
                                const at = cursor === null ? (e.key === "ArrowUp" ? history.length - 1 : null) : cursor + (e.key === "ArrowUp" ? -1 : 1);
                                if (at === null || at >= history.length) { setCursor(null); setText(""); return; }
                                const clamped = Math.max(0, at);
                                setCursor(clamped);
                                setText(history[clamped]);
                            }
                        }}
                    />
                </label>
            </div>
        </>
    );
}
