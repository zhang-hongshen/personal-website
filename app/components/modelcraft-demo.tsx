import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "~/lib/utils";
import chatLight from "~/assets/modelcraft/chat_light.webp";
import chatDark from "~/assets/modelcraft/chat_dark.webp";
import modelStoreLight from "~/assets/modelcraft/model_store_light.webp";
import modelStoreDark from "~/assets/modelcraft/model_store_dark.webp";
import connectorsLight from "~/assets/modelcraft/connectors_light.webp";
import connectorsDark from "~/assets/modelcraft/connectors_dark.webp";
import scheduledTasksLight from "~/assets/modelcraft/scheduled_tasks_light.webp";
import scheduledTasksDark from "~/assets/modelcraft/scheduled_tasks_dark.webp";

// A clickable ModelCraft window: the screenshots stacked on top of each other, with buttons laid over
// the spots where the app has them. Positions are measured on the screenshots scaled to 2000px wide,
// and the frame is a size container, so `at(x)` (x / 20 cqw) keeps them in place at any width.

type View = "chat" | "store" | "connectors" | "tasks";

const SHOTS: Record<View, { light: string; dark: string; alt: string }> = {
    chat: { light: chatLight, dark: chatDark, alt: "ModelCraft conversation" },
    store: { light: modelStoreLight, dark: modelStoreDark, alt: "ModelCraft Model Store" },
    connectors: { light: connectorsLight, dark: connectorsDark, alt: "ModelCraft Connectors" },
    tasks: { light: scheduledTasksLight, dark: scheduledTasksDark, alt: "ModelCraft Scheduled Tasks" },
};

const TABS: { view: View; label: string }[] = [
    { view: "chat", label: "modelcraft.demo_chat" },
    { view: "store", label: "modelcraft.model_store" },
    { view: "connectors", label: "modelcraft.demo_connectors" },
    { view: "tasks", label: "modelcraft.scheduled_tasks" },
];

/** Sidebar rows, by the vertical center of each; "New Chat" and the recent chat both open the chat. */
const SIDEBAR: { view: View; y: number; label: string }[] = [
    { view: "chat", y: 138, label: "New Chat" },
    { view: "store", y: 177, label: "Model Store" },
    { view: "connectors", y: 260, label: "Connectors" },
    { view: "tasks", y: 301, label: "Scheduled Tasks" },
    { view: "chat", y: 425, label: "Daily Notes Digest" },
];

/** Model Store cards, row by row, with the center of each one's download arrow. The last is already downloaded. */
const MODELS = [
    "Qwen3.8-27B-4bit", "olmOCR-2-7B-1025-mlx-8bit", "Devstral-Small-2-24B-Instruct-2512-4bit", "Qwen3.6-27B-4bit", "Qwen3.8-27B-8bit",
    "Qwen3.6-35B-A3B-4bit", "gemma-3-4b-it-qat-4bit", "gemma-3-12b-it-4bit", "gemma-4-e4b-it-4bit", "Qwen3.5-9B-MLX-4bit",
    "gemma-3-4b-it-8bit", "gemma-4-e2b-it-4bit", "Qwen2-VL-2B-Instruct-4bit", "Qwen2.5-VL-7B-Instruct-4bit", "gemma-3-27b-it-qat-4bit",
    "Qwen3.5-9B-4bit", "gemma-4-31b-it-4bit", "Qwen3-VL-4B-Instruct-4bit", "gemma-3-12b-it-qat-4bit", "gemma-4-E2B-it-qat-mobile",
    "gemma-4-26b-a4b-it-4bit", "llava-v1.6-mistral-7b-4bit", "gemma-4-E4B-it-qat-mobile", "llava-1.5-7b-4bit",
].map((name, i) => ({ name, x: [623, 930, 1238, 1546, 1853][i % 5], y: [170, 357, 543, 729, 915][Math.floor(i / 5)] }));

/** Connector rows, by the vertical center of each one's Install / Uninstall button. */
const CONNECTORS = [
    { name: "Arthub", y: 193, installed: true },
    { name: "Cellar", y: 322, installed: true },
    { name: "Keel", y: 451, installed: false },
    { name: "TuneStudio", y: 580, installed: false },
];

const DOWNLOAD_MS = 2400;

const at = (px: number) => `${px / 20}cqw`;

/** Places a box of `w` by `h` centered on (`x`, `y`). */
const box = (x: number, y: number, w: number, h: number): CSSProperties => ({
    left: at(x - w / 2), top: at(y - h / 2), width: at(w), height: at(h),
});

const CARD = "bg-[#fffdfc] dark:bg-[#26272e]";
const ACCENT = "text-[#a95f2f] dark:text-[#d99462]";
const HOVER = "cursor-pointer rounded-[0.5cqw] transition-[background-color,box-shadow] hover:bg-[#a95f2f]/8 hover:shadow-[0_0_0_0.15cqw_#a95f2f66] dark:hover:bg-[#d99462]/10 dark:hover:shadow-[0_0_0_0.15cqw_#d9946266]";

export function ModelCraftDemo({ className }: { className?: string }) {
    const { t } = useTranslation();
    const [view, setView] = useState<View>("chat");
    const [touched, setTouched] = useState(false);
    // Download progress from 0 to 1 by model index; missing means not started.
    const [downloads, setDownloads] = useState<Record<number, number>>({});
    const [installed, setInstalled] = useState(() => CONNECTORS.map((c) => c.installed));
    const started = useRef<Record<number, number>>({});

    const downloading = Object.values(downloads).some((p) => p < 1);
    useEffect(() => {
        if (!downloading) return;
        let frame = requestAnimationFrame(function tick(now) {
            setDownloads((d) => {
                const next = { ...d };
                for (const i of Object.keys(started.current).map(Number)) {
                    next[i] = Math.min(1, (now - started.current[i]) / DOWNLOAD_MS);
                    if (next[i] === 1) delete started.current[i];
                }
                return next;
            });
            frame = requestAnimationFrame(tick);
        });
        return () => cancelAnimationFrame(frame);
    }, [downloading]);

    const open = (v: View) => {
        setView(v);
        setTouched(true);
    };
    const download = (i: number) => {
        if (i in downloads) return;
        started.current[i] = performance.now();
        setDownloads((d) => ({ ...d, [i]: 0 }));
    };

    return (
        <div className={className}>
            <div className="relative aspect-[2400/1374] w-full select-none [container-type:inline-size]">
                {(Object.keys(SHOTS) as View[]).map((v) => (
                    <div
                        key={v}
                        aria-hidden={v !== view}
                        className={cn("absolute inset-0 transition-opacity duration-300", v === view ? "opacity-100" : "pointer-events-none opacity-0")}
                    >
                        <img className="only-light size-full object-cover object-top" src={SHOTS[v].light} alt={SHOTS[v].alt} width={2400} height={1374} loading={v === "chat" ? undefined : "lazy"} draggable={false} />
                        <img className="only-dark size-full object-cover object-top" src={SHOTS[v].dark} alt={SHOTS[v].alt} width={2400} height={1374} loading="lazy" draggable={false} />
                    </div>
                ))}

                {SIDEBAR.map((row) => (
                    <button
                        key={row.y}
                        type="button"
                        aria-label={row.label}
                        aria-current={row.view === view || undefined}
                        className={cn("absolute", HOVER)}
                        style={box(207, row.y, 244, 40)}
                        onClick={() => open(row.view)}
                    >
                        {!touched && row.view === "store" && (
                            <span className="absolute inset-0 rounded-[0.5cqw] shadow-[0_0_0_0.2cqw_#a95f2f] motion-safe:animate-pulse dark:shadow-[0_0_0_0.2cqw_#d99462]" />
                        )}
                    </button>
                ))}

                {view === "store" && MODELS.map((m, i) => {
                    const progress = downloads[i];
                    return (
                        <button
                            key={m.name}
                            type="button"
                            aria-label={progress === 1 ? m.name : t("modelcraft.demo_download", { name: m.name })}
                            className={cn("absolute flex items-center justify-center rounded-full", progress === undefined ? HOVER : CARD)}
                            style={box(m.x, m.y + 1, 40, 40)}
                            onClick={() => download(i)}
                        >
                            {progress !== undefined && progress < 1 && <ProgressRing progress={progress} />}
                            {progress === 1 && <DoneMark />}
                        </button>
                    );
                })}

                {view === "connectors" && CONNECTORS.map((c, i) => (
                    <button
                        key={c.name}
                        type="button"
                        aria-label={t(installed[i] ? "modelcraft.demo_uninstall" : "modelcraft.demo_install", { name: c.name })}
                        className={cn("absolute flex items-center justify-end", installed[i] !== c.installed ? CARD : HOVER)}
                        style={box(1838, c.y, 112, 40)}
                        onClick={() => setInstalled((s) => s.map((v, j) => (j === i ? !v : v)))}
                    >
                        {installed[i] !== c.installed && <ConnectorButton installed={installed[i]} />}
                    </button>
                ))}
            </div>

            <div className="mt-6 flex flex-col items-center gap-3">
                <div role="tablist" className="inline-flex flex-wrap justify-center gap-1 rounded-full border border-border bg-card p-1 shadow-card">
                    {TABS.map((tab) => (
                        <button
                            key={tab.view}
                            type="button"
                            role="tab"
                            aria-selected={tab.view === view}
                            className={cn(
                                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                                tab.view === view ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                            )}
                            onClick={() => open(tab.view)}
                        >
                            {t(tab.label)}
                        </button>
                    ))}
                </div>
                <p className="text-[13px] text-faint">{t("modelcraft.demo_hint")}</p>
            </div>
        </div>
    );
}

function ProgressRing({ progress }: { progress: number }) {
    return (
        <svg viewBox="0 0 24 24" className={cn("size-[1.2cqw] -rotate-90", ACCENT)}>
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3" pathLength="1" strokeDasharray={`${progress} 1`} strokeLinecap="round" />
        </svg>
    );
}

/** The green check the app shows on a downloaded model. */
function DoneMark() {
    return (
        <svg viewBox="0 0 24 24" className="size-[1.05cqw] text-[#68bc6b] motion-safe:animate-in motion-safe:zoom-in-50 dark:text-[#78d178]">
            <circle cx="12" cy="12" r="12" fill="currentColor" />
            <path d="m7 12.5 3.2 3L17 9" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

/** The connector button drawn in the app's style, for a connector whose state differs from the screenshot. */
function ConnectorButton({ installed }: { installed: boolean }) {
    return installed ? (
        <span className={cn("rounded-[0.35cqw] bg-[#faf7ef] px-[0.8cqw] py-[0.4cqw] text-[0.85cqw] leading-none dark:bg-[#2d2d2d]", ACCENT)}>
            Uninstall
        </span>
    ) : (
        <span className="mr-[0.25cqw] rounded-[0.35cqw] bg-[#a95f2f] px-[0.75cqw] py-[0.4cqw] text-[0.85cqw] leading-none font-medium text-white dark:bg-[#d99462] dark:text-[#2a1d19]">
            Install
        </span>
    );
}
