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
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/55 dark:bg-rose-950/30 dark:text-rose-200",
    iconShellClassName:
      "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
    iconClassName: "text-rose-600 dark:text-rose-200",
    toastClassName:
      "border-rose-200/80 bg-white/95 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.32)] dark:border-rose-900/45 dark:bg-[#2b2d2f]/95",
    unreadClassName:
      "border-rose-300/80 bg-rose-50/90 dark:border-rose-900/55 dark:bg-rose-950/[0.26]",
  },
  HIGH: {
    label: "Высокий",
    icon: AlertTriangle,
    badgeClassName:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/55 dark:bg-amber-950/30 dark:text-amber-200",
    iconShellClassName:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200",
    iconClassName: "text-amber-600 dark:text-amber-200",
    toastClassName:
      "border-amber-200/80 bg-white/95 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.32)] dark:border-amber-900/45 dark:bg-[#2b2d2f]/95",
    unreadClassName:
      "border-amber-300/80 bg-amber-50/90 dark:border-amber-900/55 dark:bg-amber-950/[0.26]",
  },
  NORMAL: {
    label: "Обычный",
    icon: Bell,
    badgeClassName:
      "border-primary/20 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/[0.14] dark:text-primary",
    iconShellClassName:
      "bg-primary/12 text-primary dark:bg-primary/[0.18] dark:text-primary",
    iconClassName: "text-primary",
    toastClassName:
      "border-primary/20 bg-white/95 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.32)] dark:border-primary/20 dark:bg-[#2b2d2f]/95",
    unreadClassName:
      "border-primary/35 bg-primary/[0.08] dark:border-primary/35 dark:bg-primary/[0.16]",
  },
  LOW: {
    label: "Низкий",
    icon: CircleDashed,
    badgeClassName:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700/60 dark:bg-slate-900/35 dark:text-slate-200",
    iconShellClassName:
      "bg-slate-100 text-slate-700 dark:bg-slate-900/45 dark:text-slate-200",
    iconClassName: "text-slate-500 dark:text-slate-200",
    toastClassName:
      "border-slate-200/80 bg-white/95 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.32)] dark:border-slate-700/35 dark:bg-[#2b2d2f]/95",
    unreadClassName:
      "border-slate-300/70 bg-slate-50/90 dark:border-slate-700/45 dark:bg-slate-900/[0.26]",
  },
};

export function getNotificationSeverityMeta(
  severity: NotificationSeverity,
): NotificationSeverityMeta {
  return severityMeta[severity];
}
