import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "~/lib/utils";
import { CONNECTORS, MODELS } from "./data";
import { ACCENT, ACCENT_BG, BODY, CARD, HOVER, MAIN, MUTED, PILL, SMALL, TEXT, TITLE, box, u } from "./ui";

/** Download buttons over the Model Store screenshot's arrows; `downloads` is progress from 0 to 1 by model name. */
export function StoreOverlay({ downloads, onDownload }: { downloads: Record<string, number>; onDownload: (name: string) => void }) {
    const { t } = useTranslation();
    return MODELS.map((m) => {
        const progress = downloads[m.name];
        return (
            <button
                key={m.name}
                type="button"
                aria-label={progress === 1 ? m.name : t("modelcraft.demo_download", { name: m.name })}
                className={cn("absolute flex items-center justify-center rounded-full", progress === undefined ? HOVER : CARD)}
                style={box(m.x, m.y + 1, 40, 40)}
                onClick={() => onDownload(m.name)}
            >
                {progress !== undefined && progress < 1 && <ProgressRing progress={progress} />}
                {progress === 1 && <DoneMark />}
            </button>
        );
    });
}

/** Install / Uninstall over the Connectors screenshot, drawn anew where the state differs from it. */
export function ConnectorsOverlay({ installed, onToggle }: { installed: Record<string, boolean>; onToggle: (name: string) => void }) {
    const { t } = useTranslation();
    return CONNECTORS.map((c) => {
        const on = installed[c.name];
        return (
            <button
                key={c.name}
                type="button"
                aria-label={t(on ? "modelcraft.demo_uninstall" : "modelcraft.demo_install", { name: c.name })}
                className={cn("absolute flex items-center justify-end", on !== c.installed ? CARD : HOVER)}
                style={box(1838, c.y, 112, 40)}
                onClick={() => onToggle(c.name)}
            >
                {on !== c.installed && (on ? (
                    <span className={cn("rounded-[0.35cqw] text-[0.85cqw] leading-none", PILL, ACCENT)} style={{ padding: `${u(8)} ${u(16)}` }}>Uninstall</span>
                ) : (
                    <span className={cn("rounded-[0.35cqw] text-[0.85cqw] leading-none font-medium", ACCENT_BG)} style={{ marginRight: u(5), padding: `${u(8)} ${u(15)}` }}>Install</span>
                ))}
            </button>
        );
    });
}

/** Downloaded Models, which the app shows as a list; picking one makes it the chat's model. */
export function DownloadedView({ models, current, onPick }: { models: { name: string; size: string }[]; current: string; onPick: (name: string) => void }) {
    return (
        <div className={cn("absolute inset-0", MAIN, TEXT)}>
            <p className={cn("absolute", TITLE)} style={{ left: u(25), top: u(18) }}>Downloaded Models</p>
            <div className="absolute inset-x-0 bottom-0 flex flex-col overflow-y-auto" style={{ top: u(85), padding: `0 ${u(8)} ${u(20)} ${u(20)}`, gap: u(12) }}>
                {models.map((m) => (
                    <button
                        key={m.name}
                        type="button"
                        className={cn("flex shrink-0 items-center text-left transition-shadow hover:shadow-[0_0_0_0.15cqw_#a95f2f55] motion-safe:animate-in motion-safe:fade-in", CARD)}
                        style={{ padding: `${u(18)} ${u(20)}`, borderRadius: u(16), gap: u(16) }}
                        onClick={() => onPick(m.name)}
                    >
                        <span className={cn("flex items-center justify-center rounded-[0.6cqw] bg-[#a95f2f]/10", ACCENT)} style={{ width: u(52), height: u(52) }}>
                            <Package style={{ width: u(26), height: u(26) }} strokeWidth={1.7} />
                        </span>
                        <span className="flex-1">
                            <span className={cn("block", TITLE)}>{m.name}</span>
                            <span className={cn("block", SMALL, MUTED)} style={{ marginTop: u(4) }}>{m.size} · MLX</span>
                        </span>
                        {m.name === current ? (
                            <span className={cn("rounded-full", BODY, ACCENT_BG)} style={{ padding: `${u(6)} ${u(14)}` }}>In use</span>
                        ) : (
                            <span className={cn(BODY, ACCENT)}>Use in chat</span>
                        )}
                    </button>
                ))}
                <p className={cn(SMALL, MUTED)} style={{ marginTop: u(6), paddingLeft: u(4) }}>Models you download in the Model Store show up here.</p>
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
