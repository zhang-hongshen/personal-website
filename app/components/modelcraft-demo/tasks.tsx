import { useEffect, useRef, type ReactNode } from "react";

import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import type { Task } from "./data";
import { Spinner } from "./spinner";
import { ACCENT, ACCENT_BG, BAR, BODY, CAPSULE, CARD, MUTED, SMALL, TITLE, TOOL_ITEM } from "./ui";

/** Scheduled Tasks. "+" adds a prepared task where the app opens its editor sheet. */
export function TasksView({ tasks, canAdd, running, ran, sidebarButton, onAdd, onToggle, onRun, onOpenRun }: {
    tasks: Task[];
    /** Whether presets are left for "+" to add. */
    canAdd: boolean;
    running: string[];
    /** Tasks run in this visit. */
    ran: string[];
    sidebarButton: ReactNode;
    onAdd: () => void;
    onToggle: (id: string) => void;
    onRun: (id: string) => void;
    onOpenRun: (id: string) => void;
}) {
    const list = useRef<HTMLDivElement>(null);
    const count = useRef(tasks.length);

    // Scroll a task that "+" just added into view.
    useEffect(() => {
        if (tasks.length > count.current) list.current?.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        count.current = tasks.length;
    }, [tasks.length]);

    return (
        <div className="flex h-full flex-col">
            <header className={BAR}>
                {sidebarButton}
                <h4 className={cn("flex-1", TITLE)}>Scheduled Tasks</h4>
                <div className={cn(CAPSULE, "gap-1 px-1")}>
                    <span className="flex size-7 items-center justify-center"><SFSymbol name="calendar.badge.clock" className="size-4" /></span>
                    <button
                        type="button"
                        aria-label="New Task"
                        title="New Task"
                        disabled={!canAdd}
                        className={TOOL_ITEM}
                        onClick={onAdd}
                    >
                        <SFSymbol name="plus" className="size-3.5" />
                        {canAdd && tasks.length === 3 && (
                            <span className="absolute inset-0 rounded-full shadow-[0_0_0_2px_#b4581f] motion-safe:animate-pulse dark:shadow-[0_0_0_2px_#e8915a]" />
                        )}
                    </button>
                </div>
            </header>

            <div ref={list} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-4">
                {tasks.map((task) => {
                    const isRunning = running.includes(task.id);
                    return (
                        <article key={task.id} className={cn("flex shrink-0 flex-wrap gap-x-4 gap-y-3 rounded-xl p-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2", CARD)}>
                            <div className="min-w-[220px] flex-1">
                                <h5 className={TITLE}>{task.title}</h5>
                                <p className={cn("mt-0.5", SMALL, MUTED)}>{task.schedule}</p>
                                <p className={cn("mt-2", BODY)}>{task.prompt}</p>
                                <p className={cn("mt-2 flex flex-wrap items-center gap-x-2", SMALL, MUTED)}>
                                    <SFSymbol name="clock" className="size-3" />
                                    {task.enabled ? task.next : "Paused"}
                                    {ran.includes(task.id) && (
                                        <button type="button" className={cn("underline-offset-2 hover:underline", ACCENT)} onClick={() => onOpenRun(task.id)}>
                                            · Last run just now — open
                                        </button>
                                    )}
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <button
                                    type="button"
                                    disabled={isRunning}
                                    className={cn("flex h-7 items-center gap-1.5 rounded-md bg-[#b4581f]/8 px-3 text-[13px] dark:bg-[#e8915a]/12", ACCENT)}
                                    onClick={() => onRun(task.id)}
                                >
                                    {isRunning && <Spinner className="size-3.5" />}
                                    {isRunning ? "Running" : "Run Now"}
                                </button>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={task.enabled}
                                    aria-label={`${task.title} enabled`}
                                    className={cn("relative h-7 w-[52px] shrink-0 rounded-full transition-colors", task.enabled ? ACCENT_BG : "bg-black/15 dark:bg-white/15")}
                                    onClick={() => onToggle(task.id)}
                                >
                                    <span className={cn("absolute top-[3px] h-[22px] w-[30px] rounded-full bg-white shadow transition-[left]", task.enabled ? "left-[19px]" : "left-[3px]")} />
                                </button>
                                <SFSymbol name="ellipsis" className={cn("mt-1 w-4", MUTED)} />
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
