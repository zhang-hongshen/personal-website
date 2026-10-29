import { useEffect, useRef, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { DemoScroll } from "~/components/mac-ui";
import { cn } from "~/lib/utils";

// A demo window beside a few words on each part of the app. Picking a part opens it in the window, and
// going somewhere in the window picks the part it belongs to.

/** Which part of the app a tour is on, for a demo window that takes part in one. */
export type Tour<S extends string> = { stop: S; onStop: (stop: S) => void };

export type TourStop<S extends string> = { id: S; title: string; body: string };

/** The list of parts beside the window; only the picked one shows its text. */
export function FeatureTour<S extends string>({ stops, stop, onStop, className, children }: {
    stops: TourStop<S>[];
    stop: S;
    onStop: (stop: S) => void;
    className?: string;
    children: ReactNode;
}) {
    const { t } = useTranslation();
    return (
        <div className={cn("grid items-center gap-8 text-left lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-12", className)}>
            <ul className="flex flex-col gap-1">
                {stops.map((f) => {
                    const active = f.id === stop;
                    return (
                        <li key={f.id}>
                            <button
                                type="button"
                                aria-pressed={active}
                                className={cn(
                                    "w-full py-2 text-left text-[clamp(19px,2.2vw,22px)] leading-tight font-semibold tracking-[-0.015em] transition-colors",
                                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                                )}
                                onClick={() => onStop(f.id)}
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
            <DemoScroll minWidth={704} className="min-w-0">{children}</DemoScroll>
        </div>
    );
}

/**
 * Ties a demo window to its tour: a stop picked beside the window goes there with `go`, and the stop
 * `current` names, worked out from where the window is, is reported back. Without a tour it does nothing.
 */
export function useTour<S extends string>(tour: Tour<S> | undefined, current: S, go: (stop: S) => void) {
    const latest = useRef({ current, go, onStop: tour?.onStop });
    latest.current = { current, go, onStop: tour?.onStop };
    const stop = tour?.stop;
    useEffect(() => {
        if (stop !== undefined && stop !== latest.current.current) latest.current.go(stop);
    }, [stop]);
    useEffect(() => {
        latest.current.onStop?.(current);
    }, [current]);
}
