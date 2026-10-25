import { CalendarClock, Clock, Ellipsis, LoaderCircle, Plus } from "lucide-react";
import { useEffect, useRef } from "react";

import { cn } from "~/lib/utils";
import type { Task } from "./data";
import { ACCENT, ACCENT_BG, BODY, CARD, MAIN, MUTED, PILL, SMALL, TEXT, TITLE, u } from "./ui";

export function TasksView({ tasks, canAdd, running, ran, onAdd, onToggle, onRun, onOpenRun }: {
    tasks: Task[];
    /** Whether presets are left for "+" to add. */
    canAdd: boolean;
    running: string[];
    /** Tasks run in this visit. */
    ran: string[];
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
        <div className={cn("absolute inset-0", MAIN, TEXT)}>
            <p className={cn("absolute", TITLE)} style={{ left: u(25), top: u(18) }}>Scheduled Tasks</p>
            <div className={cn("absolute flex items-center rounded-full", CARD, MUTED)} style={{ right: u(14), top: u(8), height: u(48), padding: `0 ${u(12)}`, gap: u(18) }}>
                <CalendarClock style={{ width: u(24), height: u(24) }} strokeWidth={1.6} />
                <button
                    type="button"
                    aria-label="New Task"
                    disabled={!canAdd}
                    className={cn("relative flex items-center justify-center rounded-full disabled:opacity-35", canAdd && "hover:text-[#a95f2f] dark:hover:text-[#d99462]")}
                    style={{ width: u(30), height: u(30) }}
                    onClick={onAdd}
                >
                    <Plus style={{ width: u(26), height: u(26) }} strokeWidth={1.8} />
                    {canAdd && ran.length === 0 && tasks.length === 3 && (
                        <span className="absolute -inset-[0.3cqw] rounded-full shadow-[0_0_0_0.18cqw_#a95f2f] motion-safe:animate-pulse dark:shadow-[0_0_0_0.18cqw_#d99462]" />
                    )}
                </button>
            </div>

            <div ref={list} className="absolute inset-x-0 bottom-0 flex flex-col overflow-y-auto" style={{ top: u(85), padding: `0 ${u(8)} ${u(20)} ${u(20)}`, gap: u(16) }}>
                {tasks.map((task) => {
                    const isRunning = running.includes(task.id);
                    return (
                        <article key={task.id} className={cn("relative shrink-0 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2", CARD)} style={{ padding: `${u(22)} ${u(20)}`, borderRadius: u(16) }}>
                            <h4 className={TITLE}>{task.title}</h4>
                            <p className={cn(SMALL, MUTED)} style={{ marginTop: u(4) }}>{task.schedule}</p>
                            <p className={BODY} style={{ marginTop: u(10), paddingRight: u(300) }}>{task.prompt}</p>
                            <p className={cn("flex items-center", SMALL, MUTED)} style={{ marginTop: u(10), gap: u(10) }}>
                                <Clock style={{ width: u(16), height: u(16) }} />
                                {task.enabled ? task.next : "Paused"}
                                {ran.includes(task.id) && (
                                    <button type="button" className={cn("underline-offset-2 hover:underline", ACCENT)} onClick={() => onOpenRun(task.id)}>
                                        · Last run just now — open
                                    </button>
                                )}
                            </p>

                            <div className="absolute flex items-center" style={{ top: u(20), right: u(20), gap: u(16) }}>
                                <button
                                    type="button"
                                    disabled={isRunning}
                                    className={cn("flex items-center rounded-[0.4cqw] transition-colors", PILL, ACCENT, BODY)}
                                    style={{ height: u(34), padding: `0 ${u(16)}`, gap: u(6) }}
                                    onClick={() => onRun(task.id)}
                                >
                                    {isRunning && <LoaderCircle className="motion-safe:animate-spin" style={{ width: u(16), height: u(16) }} />}
                                    {isRunning ? "Running" : "Run Now"}
                                </button>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={task.enabled}
                                    aria-label={`${task.title} enabled`}
                                    className={cn("relative rounded-full transition-colors", task.enabled ? ACCENT_BG : "bg-black/15 dark:bg-white/15")}
                                    style={{ width: u(70), height: u(32) }}
                                    onClick={() => onToggle(task.id)}
                                >
                                    <span
                                        className="absolute rounded-full bg-white shadow transition-[left]"
                                        style={{ top: u(3), width: u(40), height: u(26), left: task.enabled ? u(27) : u(3) }}
                                    />
                                </button>
                                <Ellipsis className={MUTED} style={{ width: u(22), height: u(22) }} />
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
