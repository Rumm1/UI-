import { AlertCircle, Inbox } from "lucide-react";
import { Button } from "../ui/button";

interface StatePanelProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "empty" | "error";
}

export function StatePanel({
  title,
  description,
  actionLabel,
  onAction,
  variant = "empty",
}: StatePanelProps) {
  const Icon = variant === "error" ? AlertCircle : Inbox;

  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction ? (
        <Button onClick={onAction} className="mt-5 rounded-xl">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
