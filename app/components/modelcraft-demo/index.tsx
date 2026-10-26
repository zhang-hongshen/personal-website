import { useState } from "react";

import { FeatureTour, type TourStop } from "~/components/tour";
import { cn } from "~/lib/utils";
import type { View } from "./data";
import { Desktop, appOf } from "./desktop";
import { ModelCraftWindow } from "./window";

// ModelCraft on the page twice: on a Mac desktop at the top, where the apps it uses open beside it, and
// further down on its own, beside a few words on each part of the app.

/** What the text beside the window explains, one entry per part of the app; picking one opens it. */
const FEATURES: TourStop<View>[] = [
    { id: "chat", title: "modelcraft.demo_chat_title", body: "modelcraft.demo_chat_body" },
    { id: "connectors", title: "modelcraft.works_your_other_apps_for", body: "modelcraft.modelcraft_connects_to_arthub_and" },
    { id: "store", title: "modelcraft.pick_a_model_download_in", body: "modelcraft.browse_popular_open_models_downloads" },
    { id: "tasks", title: "modelcraft.runs_on_its_own_schedule", body: "modelcraft.give_it_a_prompt_and_a_time" },
];

const FRAME = "rounded-[18px] border-black/12 shadow-[0_24px_70px_-20px_rgb(0_0_0/0.35)] dark:border-white/12";

/** The window beside its features: picking a feature opens that part, and going somewhere in the window picks its feature. */
export function ModelCraftDemo({ className }: { className?: string }) {
    const [view, setView] = useState<View>("chat");
    // Downloaded Models is part of the Model Store.
    const feature = view === "downloaded" ? "store" : view;

    return (
        <FeatureTour stops={FEATURES} stop={feature} onStop={setView} className={className}>
            <ModelCraftWindow className={cn("h-[min(640px,80vh)]", FRAME)} view={view} onView={setView} />
        </FeatureTour>
    );
}

/**
 * ModelCraft on a Mac desktop with Finder and the apps it connects to in the Dock. Each opens as a window
 * running its own demo; when a reply uses one, its icon bounces and its window comes forward until the
 * answer is written.
 */
export function ModelCraftDesktop({ className }: { className?: string }) {
    const [view, setView] = useState<View>("chat");
    return (
        // Below the desktop's minimum width plus the page's side padding (1008), it scrolls sideways rather than
        // squeezing; only then, so the scroll box doesn't clip its shadow on wider screens.
        <div className={cn("text-left max-[1008px]:-mx-6 max-[1008px]:overflow-x-auto max-[1008px]:overscroll-x-contain max-[1008px]:px-6 max-[1008px]:pb-6 xl:-mx-20", className)}>
            <Desktop>
                {(desktop) => (
                    <ModelCraftWindow
                        className="h-full rounded-[12px] border-black/15 shadow-[0_20px_60px_-15px_rgb(0_0_0/0.45)] dark:border-white/15"
                        view={view}
                        onView={setView}
                        onCall={(tool) => {
                            const app = appOf(tool);
                            if (app) desktop.use(app);
                        }}
                        onWriting={() => desktop.focus("modelcraft")}
                    />
                )}
            </Desktop>
        </div>
    );
}
