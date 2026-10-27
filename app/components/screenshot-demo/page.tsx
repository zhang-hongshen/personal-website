import { memo } from "react";

import { useText, type L } from "~/components/demo-text";
import { MAC, TrafficLights } from "~/components/mac-ui";
import { SFSymbol } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";

// The window that was captured: Screenshot's own README in a reader, long enough to need scrolling.
// It is drawn once at full size and again, shrunk, for the overview.

/** The captured window, in points: its width, the toolbar, and the page under it at full length. */
export const WIN = { w: 560 };
export const TOOLBAR_H = 52;
export const DOC_H = 1370;

export function Toolbar() {
    const s = useText();
    return (
        <div className={cn("flex items-center gap-3 border-b px-4", MAC.line)} style={{ height: TOOLBAR_H }}>
            <TrafficLights />
            <SFSymbol name="sidebar.left" className={cn("ml-3 size-4", MAC.muted)} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">README.md</p>
                <p className={cn("truncate text-[11px]", MAC.muted)}>{s(["Screenshot — 6 KB", "Screenshot — 6 KB", "Screenshot — 6 KB"])}</p>
            </div>
            <SFSymbol name="square.and.arrow.up" className={cn("size-4", MAC.muted)} />
        </div>
    );
}

const FEATURES: [L, L][] = [
    [["Capture", "截图", "截圖"], ["Click a window or drag out a region, then move or resize it.", "点击窗口或拖出区域，截图前还能移动、缩放。", "點按視窗或拖出區域，截圖前還能移動、縮放。"]],
    [["Markup in place", "原地标注", "原地標註"], ["Draw, add shapes, text and blur right where you captured.", "画笔、形状、文字、模糊，就在截图的地方。", "畫筆、形狀、文字、模糊，就在截圖的地方。"]],
    [["Scrolling capture", "滚动截图", "捲動截圖"], ["Scroll as usual; every scroll area comes out in full.", "照常滚动，每个滚动区域都完整展开。", "照常捲動，每個捲動區域都完整展開。"]],
    [["Preview and edit", "预览与编辑", "預覽與編輯"], ["A thumbnail floats in the corner; click it to keep editing.", "角落浮出缩略图，点开继续编辑。", "角落浮出縮圖，點開繼續編輯。"]],
    [["Combine", "拼图", "拼圖"], ["Drag several captures together; edges snap.", "把多张截图拖到一起，边缘自动吸附。", "把多張截圖拖到一起，邊緣自動吸附。"]],
];

function Lines({ widths }: { widths: number[] }) {
    return (
        <div className="flex flex-col gap-2">
            {widths.map((w, i) => <i key={i} className="block h-2 rounded-full bg-black/10 dark:bg-white/12" style={{ width: `${w}%` }} />)}
        </div>
    );
}

function Code({ lines }: { lines: string[] }) {
    return (
        <pre className="rounded-lg bg-black/[0.04] px-4 py-3 font-mono text-[11.5px] leading-[1.7] dark:bg-white/[0.06]">
            {lines.join("\n")}
        </pre>
    );
}

function H2({ children }: { children: string }) {
    return <h2 className={cn("mt-8 mb-3 border-b pb-1.5 text-[18px] font-bold", MAC.line)}>{children}</h2>;
}

/** The page inside the window, at full length. */
export const Doc = memo(function Doc() {
    const s = useText();
    return (
        <div className="overflow-hidden px-9 pt-7" style={{ height: DOC_H, width: WIN.w }}>
            <h1 className="text-[28px] font-bold tracking-tight">Screenshot</h1>
            <p className="mt-2 text-[14px]">{s(["A native macOS menu bar screenshot tool, built for scrolling capture.", "一款原生 SwiftUI 编写的 macOS 菜单栏截图工具，主打滚动截图。", "一款原生 SwiftUI 編寫的 macOS 選單列截圖工具，主打捲動截圖。"])}</p>

            <div className="mt-5 flex h-[170px] items-end gap-3 rounded-xl bg-linear-to-br from-[#6aa8ff] to-[#3b3fd8] p-4">
                <div className="h-full flex-1 rounded-lg bg-white/85 p-3 shadow-lg dark:bg-[#1e1e1e]/85"><Lines widths={[60, 90, 75, 85, 40]} /></div>
                <div className="h-[70%] w-[30%] rounded-lg bg-white/60 shadow-lg dark:bg-white/20" />
            </div>

            <H2>{s(["Features", "特性", "特色"])}</H2>
            <ul className="flex flex-col gap-3">
                {FEATURES.map(([title, body]) => (
                    <li key={title[0]} className="flex gap-2.5 text-[13px]">
                        <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-current opacity-50" />
                        <span><b>{s(title)}</b>{s(["  ", "：", "："])}{s(body)}</span>
                    </li>
                ))}
            </ul>

            <div className="mt-6 grid grid-cols-2 gap-3">
                {["#ffb35c", "#5cc9a7"].map((c) => (
                    <div key={c} className="flex h-[110px] flex-col justify-end rounded-xl p-3" style={{ background: `linear-gradient(135deg, ${c}, color-mix(in srgb, ${c}, #000 25%))` }}>
                        <i className="block h-2 w-1/2 rounded-full bg-white/70" />
                    </div>
                ))}
            </div>

            <H2>{s(["Requirements", "系统要求", "系統需求"])}</H2>
            <table className={cn("w-full border text-[13px]", MAC.line)}>
                <tbody>
                    <tr className={cn("border-b", MAC.line)}><td className="px-3 py-2">{s(["Run", "运行", "執行"])}</td><td className="px-3 py-2">macOS 26+</td></tr>
                    <tr><td className="px-3 py-2">{s(["Develop", "开发", "開發"])}</td><td className="px-3 py-2">Xcode 27+</td></tr>
                </tbody>
            </table>
            <div className="mt-4"><Lines widths={[95, 70]} /></div>

            <H2>{s(["Build", "构建", "建置"])}</H2>
            <Code lines={["git clone https://github.com/zhang-hongshen/Screenshot.git", "cd Screenshot", "open Screenshot.xcodeproj"]} />
            <div className="mt-4"><Lines widths={[88, 92, 50]} /></div>

            <H2>{s(["Release", "发布", "發佈"])}</H2>
            <Lines widths={[92, 85, 96, 60]} />
            <div className="mt-4"><Code lines={['git tag -a 0.1.0 -m "0.1.0"', "git push origin 0.1.0"]} /></div>

            <H2>{s(["License", "许可证", "授權條款"])}</H2>
            <p className="text-[13px]">MIT</p>
        </div>
    );
});
