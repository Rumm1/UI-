import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CircleDashed,
  type LucideIcon,
} from "lucide-react";
import { NotificationSeverity } from "../types/notification";

interface NotificationSeverityMeta {
  label: string;
  icon: LucideIcon;
  badgeClassName: string;
  iconShellClassName: string;
  iconClassName: string;
  toastClassName: string;
  unreadClassName: string;
}

const severityMeta: Record<NotificationSeverity, NotificationSeverityMeta> = {
  CRITICAL: {
    label: "Критично",
    icon: AlertCircle,
    badgeClassName:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/25 dark:bg-rose-500/10 dark:text-rose-100",
    iconShellClassName:
      "bg-rose-500/12 text-rose-700 ring-1 ring-rose-200/70 dark:bg-rose-500/16 dark:text-rose-100 dark:ring-rose-400/20",
    iconClassName: "text-rose-600 dark:text-rose-100",
    toastClassName:
      "border-rose-200/80 bg-white/95 shadow-[0_22px_50px_-30px_rgba(225,29,72,0.55)] dark:border-rose-400/25 dark:bg-slate-950/90",
    unreadClassName:
      "border-rose-200/70 bg-rose-500/[0.08] dark:border-rose-400/15 dark:bg-rose-500/[0.12]",
  },
  HIGH: {
    label: "Высокий",
    icon: AlertTriangle,
    badgeClassName:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-100",
    iconShellClassName:
      "bg-amber-500/12 text-amber-700 ring-1 ring-amber-200/70 dark:bg-amber-500/16 dark:text-amber-100 dark:ring-amber-400/20",
    iconClassName: "text-amber-600 dark:text-amber-100",
    toastClassName:
      "border-amber-200/80 bg-white/95 shadow-[0_22px_50px_-30px_rgba(245,158,11,0.55)] dark:border-amber-400/25 dark:bg-slate-950/90",
    unreadClassName:
      "border-amber-200/70 bg-amber-500/[0.08] dark:border-amber-400/15 dark:bg-amber-500/[0.12]",
  },
  NORMAL: {
    label: "Обычный",
    icon: Bell,
    badgeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/25 dark:bg-sky-500/10 dark:text-sky-100",
    iconShellClassName:
      "bg-sky-500/12 text-sky-700 ring-1 ring-sky-200/70 dark:bg-sky-500/16 dark:text-sky-100 dark:ring-sky-400/20",
    iconClassName: "text-sky-600 dark:text-sky-100",
    toastClassName:
      "border-sky-200/80 bg-white/95 shadow-[0_22px_50px_-30px_rgba(14,165,233,0.45)] dark:border-sky-400/25 dark:bg-slate-950/90",
    unreadClassName:
      "border-sky-200/70 bg-sky-500/[0.07] dark:border-sky-400/15 dark:bg-sky-500/[0.12]",
  },
  LOW: {
    label: "Низкий",
    icon: CircleDashed,
    badgeClassName:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-400/25 dark:bg-slate-500/10 dark:text-slate-100",
    iconShellClassName:
      "bg-slate-500/12 text-slate-700 ring-1 ring-slate-200/70 dark:bg-slate-500/16 dark:text-slate-100 dark:ring-slate-400/20",
    iconClassName: "text-slate-500 dark:text-slate-100",
    toastClassName:
      "border-slate-200/80 bg-white/95 shadow-[0_20px_45px_-32px_rgba(100,116,139,0.45)] dark:border-slate-400/20 dark:bg-slate-950/90",
    unreadClassName:
      "border-slate-200/70 bg-slate-500/[0.06] dark:border-slate-400/15 dark:bg-slate-500/[0.10]",
  },
};

export function getNotificationSeverityMeta(
  severity: NotificationSeverity,
): NotificationSeverityMeta {
  return severityMeta[severity];
}
