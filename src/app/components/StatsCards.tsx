import { LucideIcon } from "lucide-react";

interface StatsCardsProps {
  items: Array<{
    id: string;
    label: string;
    value: string;
    description: string;
    icon: LucideIcon;
    accentClassName: string;
    onClick: () => void;
  }>;
}

export function StatsCards({ items }: StatsCardsProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          className="font-medical-display flex h-[62px] items-center justify-between gap-3 rounded-[10px] border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/25 hover:bg-primary/[0.04] dark:hover:border-primary/20 dark:hover:bg-primary/[0.08]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${item.accentClassName}`}
            >
              <item.icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {item.label}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">{item.description}</p>
            </div>
          </div>
          <p className="shrink-0 text-[24px] font-semibold leading-none text-foreground">
            {item.value}
          </p>
        </button>
      ))}
    </div>
  );
}
