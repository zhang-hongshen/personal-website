import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { useText } from "~/components/demo-text";
import { DemoScroll, MAC } from "~/components/mac-ui";
import { MAC_FONT } from "~/components/mac-window";
import { cn } from "~/lib/utils";
import { DOC_H, Doc, TOOLBAR_H, Toolbar, WIN } from "./page";

// Screenshot runs in the menu bar and has no window of its own to try, so the demo shows what it
// makes: a window captured top to bottom as one long picture. The picture scrolls by itself while
// nobody touches it, and the overview beside it shows the whole thing with the part in view.

const FULL = TOOLBAR_H + DOC_H;
const VIEW_H = 440;
const SPEED = 60;
const HOLD = 1.5;

export function ScreenshotDemo({ className }: { className?: string }) {
    const s = useText();
    const viewer = useRef<HTMLDivElement>(null);
    const width = useWidth(viewer);
    const [scroll, setScroll] = useState(0);
    const [paused, setPaused] = useState(false);

    const k = width ? width / WIN.w : 1;
    const height = Math.min(VIEW_H, FULL * k);

    // Scroll down slowly, wait at the bottom, then go back to the top and start over.
    useEffect(() => {
        const el = viewer.current;
        if (!el || paused || !width || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        let id = 0;
        let last = performance.now();
        let hold = 0;
        let pos = el.scrollTop;
        const loop = (now: number) => {
            const dt = Math.min(0.1, (now - last) / 1000);
            last = now;
            const max = el.scrollHeight - el.clientHeight;
            if (pos >= max) {
                hold += dt;
                if (hold > HOLD) {
                    hold = 0;
                    pos = 0;
                    el.scrollTo({ top: 0, behavior: "smooth" });
                }
            } else if (Math.abs(el.scrollTop - pos) < 2) {
                pos = Math.min(max, pos + SPEED * dt);
                el.scrollTop = pos;
            } else {
                pos = el.scrollTop;
            }
            id = requestAnimationFrame(loop);
        };
        id = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(id);
    }, [paused, width]);

    const jump = (e: React.MouseEvent<HTMLDivElement>) => {
        const el = viewer.current;
        if (!el) return;
        const box = e.currentTarget.getBoundingClientRect();
        const y = ((e.clientY - box.top) / box.height) * el.scrollHeight - el.clientHeight / 2;
        el.scrollTo({ top: y, behavior: "smooth" });
    };

    const ratio = width ? scroll / (FULL * k) : 0;
    const shown = width ? height / (FULL * k) : 0;

    return (
        <DemoScroll minWidth={720} className={className}>
            <div className="flex w-full items-start gap-6" style={{ fontFamily: MAC_FONT }}>
                <div
                    className={cn("min-w-0 flex-1 overflow-hidden rounded-[14px] border shadow-[0_24px_70px_-20px_rgb(0_0_0/0.35)]", MAC.window, MAC.line, MAC.text)}
                    onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
                    onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
                    onTouchStart={() => setPaused(true)}
                >
                    <div
                        ref={viewer}
                        className={cn("overflow-y-auto overscroll-contain text-left text-[13px]", !width && "invisible")}
                        style={{ height }}
                        onScroll={(e) => setScroll(e.currentTarget.scrollTop)}
                        role="img"
                        aria-label={s(["A long picture made with Screenshot's scrolling capture: a whole README window, top to bottom.", "用 Screenshot 滚动截图得到的长图：整个 README 窗口，从头到尾。", "用 Screenshot 捲動截圖得到的長圖：整個 README 視窗，從頭到尾。"])}
                    >
                        <Scaled k={k}><Toolbar /><Doc /></Scaled>
                    </div>
                </div>

                <div className="flex w-[22%] max-w-[150px] shrink-0 flex-col items-center gap-2">
                    <div className="relative w-full cursor-pointer overflow-hidden rounded-[6px] border border-black/12 shadow-md dark:border-white/12" onClick={jump} aria-hidden>
                        <div className={cn("pointer-events-none", MAC.window, MAC.text)} style={{ aspectRatio: `${WIN.w} / ${FULL}` }}>
                            <Fill><Toolbar /><Doc /></Fill>
                        </div>
                        <div className="absolute inset-x-0 rounded-[3px] border-2 border-accent bg-accent/10" style={{ top: `${ratio * 100}%`, height: `${shown * 100}%` }} />
                    </div>
                    <p className="text-[12px] text-faint tabular-nums">{(WIN.w * 2).toLocaleString("en-US")} × {(FULL * 2).toLocaleString("en-US")} px</p>
                </div>
            </div>
        </DemoScroll>
    );
}

/** The width of an element; null until it's measured. */
function useWidth(ref: React.RefObject<HTMLDivElement | null>) {
    const [width, setWidth] = useState<number | null>(null);
    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const update = () => setWidth(el.clientWidth);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref]);
    return width;
}

/** The picture drawn at its own width, shrunk by `k`. */
function Scaled({ k, children }: { k: number; children: ReactNode }) {
    return (
        <div className="relative overflow-hidden" style={{ height: FULL * k }}>
            <div className="absolute top-0 left-0 origin-top-left" style={{ width: WIN.w, transform: `scale(${k})` }}>{children}</div>
        </div>
    );
}

/** The picture shrunk to fill its parent's width. */
function Fill({ children }: { children: ReactNode }) {
    const box = useRef<HTMLDivElement>(null);
    const width = useWidth(box);
    return <div ref={box} className="size-full">{width && <Scaled k={width / WIN.w}>{children}</Scaled>}</div>;
}
