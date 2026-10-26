import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "~/lib/utils";
import type { View } from "./data";
import { Desktop, appOf, type AppKey } from "./desktop";
import { FinderWindow, type FolderId, type Item } from "./finder";
import { ModelCraftWindow } from "./window";

// ModelCraft on the page twice: on a Mac desktop at the top, where the apps it uses open beside it, and
// further down on its own, beside a few words on each part of the app.

/** What the text beside the window explains, one entry per part of the app; picking one opens it. */
const FEATURES: { view: View; title: string; body: string }[] = [
    { view: "chat", title: "modelcraft.demo_chat_title", body: "modelcraft.demo_chat_body" },
    { view: "connectors", title: "modelcraft.works_your_other_apps_for", body: "modelcraft.modelcraft_connects_to_arthub_and" },
    { view: "store", title: "modelcraft.pick_a_model_download_in", body: "modelcraft.browse_popular_open_models_downloads" },
    { view: "tasks", title: "modelcraft.runs_on_its_own_schedule", body: "modelcraft.give_it_a_prompt_and_a_time" },
];

const FRAME = "rounded-[18px] border-black/12 shadow-[0_24px_70px_-20px_rgb(0_0_0/0.35)] dark:border-white/12";

/** The window beside its features: picking a feature opens that part, and going somewhere in the window picks its feature. */
export function ModelCraftDemo({ className }: { className?: string }) {
    const { t } = useTranslation();
    const [view, setView] = useState<View>("chat");
    // Downloaded Models is part of the Model Store.
    const feature = view === "downloaded" ? "store" : view;

    return (
        <div className={cn("grid items-center gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-12", className)}>
            <ul className="flex flex-col gap-1">
                {FEATURES.map((f) => {
                    const active = f.view === feature;
                    return (
                        <li key={f.view}>
                            <button
                                type="button"
                                aria-pressed={active}
                                className={cn(
                                    "w-full py-2 text-left text-[clamp(19px,2.2vw,22px)] leading-tight font-semibold tracking-[-0.015em] transition-colors",
                                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                                )}
                                onClick={() => setView(f.view)}
                            >
                                {t(f.title)}
                            </button>
                            <div className={cn("grid transition-[grid-template-rows,opacity] duration-300", active ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                                <p className="overflow-hidden text-[15px] text-muted-foreground" aria-hidden={!active}>
                                    <span className="block pb-3">{t(f.body)}</span>
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ul>
            <ModelCraftWindow className={cn("h-[min(640px,80vh)]", FRAME)} view={view} onView={setView} />
        </div>
    );
}

/**
 * ModelCraft on a Mac desktop with Finder and the apps it connects to in the Dock. Each opens as a window
 * running its own demo; when a reply uses one, its icon bounces and its window comes forward until the
 * answer is written.
 */
export function ModelCraftDesktop({ className }: { className?: string }) {
    const [view, setView] = useState<View>("chat");
    // Windows opened so far (they keep their state when closed) and the ones showing, back to front.
    const [opened, setOpened] = useState<AppKey[]>([]);
    const [order, setOrder] = useState<AppKey[]>(["modelcraft"]);
    const [bounce, setBounce] = useState<{ app: AppKey; n: number } | null>(null);
    // Files replies have made, and the one Finder should show.
    const [made, setMade] = useState<Partial<Record<FolderId, Item[]>>>({});
    const [reveal, setReveal] = useState<{ folder: FolderId; name: string; n: number } | null>(null);

    const raise = (app: AppKey) => {
        setOpened((o) => (app === "modelcraft" || o.includes(app) ? o : [...o, app]));
        setOrder((o) => (o[o.length - 1] === app ? o : [...o.filter((x) => x !== app), app]));
    };
    const close = (app: AppKey) => setOrder((o) => o.filter((x) => x !== app));
    const launch = (app: AppKey) => {
        if (!order.includes(app)) setBounce((b) => ({ app, n: (b?.n ?? 0) + 1 }));
        raise(app);
    };
    // Clicking the frontmost app's icon puts its window away, as minimizing would; any other brings it forward.
    const dock = (app: AppKey) => (app !== "modelcraft" && order[order.length - 1] === app ? close(app) : launch(app));

    const called = (tool: Parameters<typeof appOf>[0]) => {
        const app = appOf(tool);
        if (!app) return;
        setBounce((b) => ({ app, n: (b?.n ?? 0) + 1 }));
        raise(app);
        if (tool.kind === "file") setReveal((r) => ({ folder: "takes", name: tool.name, n: (r?.n ?? 0) + 1 }));
        if (tool.kind === "connector" && tool.app === "tunestudio") {
            const name = "chorus-take-3 (tuned).wav";
            setMade((m) => (m.takes?.some((f) => f.name === name) ? m : { ...m, takes: [...(m.takes ?? []), { kind: "file", icon: "waveform", name, date: "Just now", size: "21.3 MB" }] }));
        }
    };

    return (
        <div className={cn("text-left xl:-mx-20", className)}>
            <Desktop
                modelcraft={<ModelCraftWindow className="h-full rounded-[12px] border-black/15 shadow-[0_20px_60px_-15px_rgb(0_0_0/0.45)] dark:border-white/15" view={view} onView={setView} onCall={called} onWriting={() => raise("modelcraft")} />}
                finder={<FinderWindow extra={made} reveal={reveal} onOpenApp={(app) => launch(app as AppKey)} />}
                opened={opened}
                order={order}
                bouncing={bounce}
                onRaise={raise}
                onClose={close}
                onDock={dock}
            />
        </div>
    );
}
