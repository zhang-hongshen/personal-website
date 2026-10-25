import { SFSymbol, type SymbolName } from "~/components/sf-symbol";
import { cn } from "~/lib/utils";
import type { Chat, View } from "./data";
import { ACCENT, FAINT, HEADER, SIDEBAR, TEXT, TOOL } from "./ui";

// The app's navigation (AppNavigationView), with its symbols.
const NAV: { view: View; label: string; icon: SymbolName }[] = [
    { view: "store", label: "Model Store", icon: "storefront" },
    { view: "downloaded", label: "Downloaded Models", icon: "shippingbox" },
    { view: "connectors", label: "Connectors", icon: "app.connected.to.app.below.fill" },
    { view: "tasks", label: "Scheduled Tasks", icon: "clock.arrow.circlepath" },
];

const ROW = "relative flex h-8 w-full shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors";
const SELECTED = "bg-[#b4581f] font-semibold text-white dark:bg-[#e8915a] dark:text-[#2a1d19]";
const UNSELECTED = "hover:bg-black/5 dark:hover:bg-white/6";

/** The window buttons, the navigation and the recent conversations. */
export function Sidebar({ view, chatId, chats, hint, className, onOpen, onOpenChat, onNewChat, onHide }: {
    view: View;
    /** The open conversation; null with view "chat" is a new chat. */
    chatId: string | null;
    chats: Chat[];
    /** Rings New Chat until the visitor tries something. */
    hint: boolean;
    className?: string;
    onOpen: (view: View) => void;
    onOpenChat: (id: string) => void;
    onNewChat: () => void;
    onHide: () => void;
}) {
    return (
        <aside className={cn("flex w-[220px] shrink-0 flex-col text-[13px]", SIDEBAR, TEXT, className)}>
            <div className="flex h-[52px] shrink-0 items-center px-4">
                <span className="flex gap-2" aria-hidden>
                    <i className="size-3 rounded-full bg-[#ff5f57]" />
                    <i className="size-3 rounded-full bg-[#febc2e]" />
                    <i className="size-3 rounded-full bg-[#28c840]" />
                </span>
                <button type="button" aria-label="Hide Sidebar" title="Hide Sidebar" className={cn("ml-auto", TOOL)} onClick={onHide}>
                    <SFSymbol name="sidebar.left" className="h-3.5 w-[18px]" />
                </button>
            </div>

            <nav className="flex flex-col gap-0.5 px-2.5">
                <button type="button" className={cn(ROW, UNSELECTED, ACCENT)} onClick={onNewChat}>
                    <SFSymbol name="square.and.pencil" className="size-4" />
                    New Chat
                    {hint && <span className="absolute inset-0 rounded-lg shadow-[0_0_0_2px_#b4581f] motion-safe:animate-pulse dark:shadow-[0_0_0_2px_#e8915a]" />}
                </button>
                {NAV.map(({ view: v, label, icon }) => (
                    <button key={v} type="button" aria-current={view === v || undefined} className={cn(ROW, view === v ? SELECTED : UNSELECTED)} onClick={() => onOpen(v)}>
                        <SFSymbol name={icon} className={cn("size-4", view !== v && ACCENT)} />
                        {label}
                    </button>
                ))}
            </nav>

            <p className={cn("mt-5 flex items-center gap-2 px-5", HEADER, FAINT)}>
                Projects
                <SFSymbol name="plus" className={cn("size-3", ACCENT)} />
            </p>
            <p className={cn("mt-4 mb-1 px-5", HEADER, FAINT)}>Recents</p>
            <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2.5 pb-3 [scrollbar-width:none]">
                {chats.map((chat) => {
                    const selected = view === "chat" && chatId === chat.id;
                    return (
                        <button
                            key={chat.id}
                            type="button"
                            aria-current={selected || undefined}
                            className={cn(ROW, "block truncate leading-8", selected ? SELECTED : UNSELECTED)}
                            onClick={() => onOpenChat(chat.id)}
                        >
                            {chat.title}
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}
