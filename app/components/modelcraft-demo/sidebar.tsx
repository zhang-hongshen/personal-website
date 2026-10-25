import { Cable, History, Package, Plus, SquarePen, Store, type LucideIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import type { Chat, View } from "./data";
import { ACCENT, BODY, FAINT, HEADER, SIDEBAR, TEXT, rect, u } from "./ui";

const NAV: { view: View; label: string; icon: LucideIcon }[] = [
    { view: "store", label: "Model Store", icon: Store },
    { view: "downloaded", label: "Downloaded Models", icon: Package },
    { view: "connectors", label: "Connectors", icon: Cable },
    { view: "tasks", label: "Scheduled Tasks", icon: History },
];

const ROW = "absolute flex items-center rounded-[0.5cqw] text-left transition-colors";
const SELECTED = "bg-[#a85e2e] font-semibold text-white dark:bg-[#de9364]";
const UNSELECTED = "hover:bg-black/5 dark:hover:bg-white/6";

/** The sidebar, laid over the screenshot's own below the window buttons. */
export function Sidebar({ view, chatId, chats, hint, onOpen, onOpenChat, onNewChat }: {
    view: View;
    /** The open conversation; null with view "chat" is a new chat. */
    chatId: string | null;
    chats: Chat[];
    /** Rings New Chat until the visitor tries something. */
    hint: boolean;
    onOpen: (view: View) => void;
    onOpenChat: (id: string) => void;
    onNewChat: () => void;
}) {
    return (
        <div className={cn("absolute overflow-hidden", SIDEBAR, TEXT, BODY)} style={rect(80, 116, 258, 914)}>
            <button type="button" className={cn(ROW, UNSELECTED, ACCENT)} style={rect(6, 2, 242, 40)} onClick={onNewChat}>
                <SquarePen className="absolute" style={{ left: u(18), width: u(22), height: u(22) }} strokeWidth={1.8} />
                <span style={{ marginLeft: u(45) }}>New Chat</span>
                {hint && <span className="absolute inset-0 rounded-[0.5cqw] shadow-[0_0_0_0.2cqw_#a95f2f] motion-safe:animate-pulse dark:shadow-[0_0_0_0.2cqw_#d99462]" />}
            </button>
            {NAV.map(({ view: v, label, icon: Icon }, i) => (
                <button
                    key={v}
                    type="button"
                    aria-current={view === v || undefined}
                    className={cn(ROW, view === v ? SELECTED : UNSELECTED)}
                    style={rect(6, [41, 83, 124, 165][i], 242, 40)}
                    onClick={() => onOpen(v)}
                >
                    <Icon className={cn("absolute", view !== v && ACCENT)} style={{ left: u(18), width: u(22), height: u(22) }} strokeWidth={1.8} />
                    <span style={{ marginLeft: u(45) }}>{label}</span>
                </button>
            ))}

            <p className={cn("absolute flex items-center", HEADER, FAINT)} style={{ left: u(10), top: u(226) }}>
                Projects
                <Plus className={ACCENT} style={{ marginLeft: u(10), width: u(18), height: u(18) }} strokeWidth={2.2} />
            </p>
            <p className={cn("absolute", HEADER, FAINT)} style={{ left: u(10), top: u(267) }}>Recents</p>
            <div className="absolute overflow-y-auto [scrollbar-width:none]" style={rect(0, 289, 258, 625)}>
                {chats.map((chat) => (
                    <button
                        key={chat.id}
                        type="button"
                        aria-current={(view === "chat" && chatId === chat.id) || undefined}
                        className={cn(
                            "relative block truncate rounded-[0.5cqw] text-left transition-colors motion-safe:animate-in motion-safe:fade-in",
                            view === "chat" && chatId === chat.id ? SELECTED : UNSELECTED,
                        )}
                        style={{ marginLeft: u(6), width: u(242), height: u(40), marginBottom: u(2), paddingLeft: u(7), paddingRight: u(10) }}
                        onClick={() => onOpenChat(chat.id)}
                    >
                        {chat.title}
                    </button>
                ))}
            </div>
        </div>
    );
}
