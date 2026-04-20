import { getStatusTone } from "../../lib/prototype";
import { Badge } from "../ui/badge";

interface StatusBadgeProps {
  label: string;
  status: string;
}

export function StatusBadge({ label, status }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusTone(status)}`}
    >
      {label}
    </Badge>
  );
}
