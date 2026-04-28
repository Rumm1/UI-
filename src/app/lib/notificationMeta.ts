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
      "border-sky-300/80 bg-sky-100/90 text-sky-900 dark:border-sky-800/70 dark:bg-sky-950/40 dark:text-sky-200",
    iconShellClassName:
      "bg-sky-100 text-sky-700 dark:bg-sky-950/45 dark:text-sky-200",
    iconClassName: "text-sky-700 dark:text-sky-200",
    toastClassName:
      "border-sky-200/80 bg-white/95 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.32)] dark:border-sky-800/40 dark:bg-[#2b2d2f]/95",
    unreadClassName:
      "border-sky-300/80 bg-sky-50/95 dark:border-sky-800/60 dark:bg-sky-950/[0.28]",
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
