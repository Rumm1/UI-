import { Link, useLocation } from "react-router";
import {
  Activity,
  Bell,
  Calendar,
  FileText,
  LayoutDashboard,
  Pill,
  Settings,
  Users,
} from "lucide-react";
import { useAppData } from "../contexts/AppDataContext";

const navItems = [
  { icon: LayoutDashboard, label: "Дашборд", path: "/" },
  { icon: Users, label: "Пациенты", path: "/patients" },
  { icon: Calendar, label: "Записи", path: "/appointments" },
  { icon: FileText, label: "Медкарты", path: "/records" },
  { icon: Pill, label: "Назначения", path: "/prescriptions" },
  { icon: Bell, label: "Уведомления", path: "/notifications" },
  { icon: Settings, label: "Настройки", path: "/settings" },
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const location = useLocation();
  const { unreadCount } = useAppData();

  return (
    <aside
      className={`hidden border-r border-border bg-card md:flex md:flex-col ${
        collapsed ? "md:w-20" : "md:w-72"
      } transition-all duration-300`}
    >
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Activity className="size-5" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">MedSystem</p>
            <p className="text-xs text-muted-foreground">
              Interactive prototype
            </p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`mb-1 flex items-center gap-3 rounded-[10px] border px-3 py-3 transition-all duration-200 ease-out ${
                isActive
                  ? "border-sky-300/55 bg-sky-500/10 text-sky-900 shadow-[0_10px_24px_-18px_rgba(14,165,233,0.85)] dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-50"
                  : "border-transparent text-muted-foreground hover:border-sky-300/35 hover:bg-sky-500/[0.06] hover:text-foreground dark:hover:border-sky-400/20 dark:hover:bg-sky-400/[0.08] dark:hover:text-sky-50"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="size-5 shrink-0" />
              {!collapsed ? (
                <>
                  <span className="flex-1 text-sm">{item.label}</span>
                  {item.path === "/notifications" && unreadCount > 0 ? (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold">
                      {unreadCount}
                    </span>
                  ) : null}
                </>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="m-3 rounded-2xl border border-border bg-muted/60 p-4">
          <p className="mb-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Demo Mode
          </p>
          <p className="text-sm font-medium text-foreground">
            Данные работают на mock-слое и синхронизируются между страницами.
          </p>
        </div>
      ) : null}
    </aside>
  );
}
