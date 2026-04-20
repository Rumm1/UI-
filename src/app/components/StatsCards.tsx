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
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          className="rounded-3xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="mb-4 flex items-start justify-between">
            <div
              className={`flex size-12 items-center justify-center rounded-2xl ${item.accentClassName}`}
            >
              <item.icon className="size-5" />
            </div>
          </div>
          <p className="mb-1 text-sm text-muted-foreground">{item.label}</p>
          <p className="mb-1 text-3xl font-semibold text-foreground">{item.value}</p>
          <p className="text-xs text-muted-foreground">{item.description}</p>
        </button>
      ))}
    </div>
  );
}
