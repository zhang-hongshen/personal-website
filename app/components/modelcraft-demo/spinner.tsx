import { cn } from "~/lib/utils";

/** The macOS progress spinner: eight bars fading around a circle, stepping round. */
export function Spinner({ className, label }: { className?: string; label?: string }) {
    return (
        <svg viewBox="0 0 24 24" role={label ? "img" : undefined} aria-label={label} aria-hidden={!label} className={cn("motion-safe:animate-[spin_0.8s_steps(8)_infinite]", className)}>
            {Array.from({ length: 8 }, (_, i) => (
                <rect key={i} x="11" y="2" width="2" height="6.5" rx="1" fill="currentColor" opacity={0.25 + (0.75 * (8 - i)) / 8} transform={`rotate(${-i * 45} 12 12)`} />
            ))}
        </svg>
    );
}
