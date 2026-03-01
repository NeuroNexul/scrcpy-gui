import { ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type OptionSectionProps = {
  title: string;
  description?: string;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  children: ReactNode;
  className?: string;
};

export function OptionSection({
  title,
  description,
  enabled,
  onEnabledChange,
  children,
  className,
}: OptionSectionProps) {
  const hasToggle = typeof enabled === "boolean" && !!onEnabledChange;

  return (
    <section
      className={cn("rounded-md border bg-card/40 p-3 space-y-2", className)}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium">{title}</h3>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>

        {hasToggle ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {enabled ? "Enabled" : "Disabled"}
            </span>
            <Switch
              size="sm"
              checked={enabled}
              onCheckedChange={onEnabledChange}
            />
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "transition-all duration-200 ease-out",
          hasToggle && !enabled
            ? "max-h-0 opacity-0 overflow-hidden"
            : "max-h-500 opacity-100 animate-in fade-in-0 slide-in-from-top-1",
        )}
      >
        <div
          className={cn(
            "flex flex-wrap items-end gap-2 *:flex-1 *:basis-55 *:min-w-45",
            hasToggle && !enabled && "pointer-events-none",
          )}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
