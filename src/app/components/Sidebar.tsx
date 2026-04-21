import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import {
  Activity,
  Calendar,
  FileText,
  LayoutDashboard,
  Menu,
  Pill,
  Settings,
  Users,
} from "lucide-react";
import { useAppData } from "../contexts/AppDataContext";

const navItems = [
  { icon: LayoutDashboard, label: "Главное", path: "/" },
  { icon: Users, label: "Пациенты", path: "/patients" },
  { icon: Calendar, label: "Записи", path: "/appointments" },
  { icon: FileText, label: "Медкарты", path: "/records" },
  { icon: Pill, label: "Назначения", path: "/prescriptions" },
  { icon: Settings, label: "Настройки", path: "/settings" },
];

interface SidebarProps {
  collapsed: boolean;
  layoutMode: "mobile" | "tablet" | "desktop";
  mobileOpen: boolean;
  onToggleSidebar: () => void;
  onCloseMobile: () => void;
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-[12px] bg-primary text-primary-foreground shadow-sm ${
        compact ? "size-10" : "size-9"
      }`}
    >
      <Activity className={compact ? "size-5" : "size-[18px]"} />
    </div>
  );
}

interface SidebarBodyProps {
  collapsed: boolean;
  mobile?: boolean;
  onNavigate?: () => void;
  onToggleSidebar: () => void;
}

function SidebarBody({
  collapsed,
  mobile = false,
  onNavigate,
  onToggleSidebar,
}: SidebarBodyProps) {
  const location = useLocation();
  const { profile } = useAppData();
  const profileInitials = profile.initials || "ИИ";

  return (
    <>
      <div
        className={`border-b border-border ${
          collapsed && !mobile
            ? "flex h-14 items-center justify-center px-2"
            : "flex h-14 items-center justify-between gap-3 px-3"
        }`}
      >
        {collapsed && !mobile ? (
          <button
            onClick={onToggleSidebar}
            className="group flex size-11 items-center justify-center rounded-[14px] border border-sky-300/35 bg-linear-to-br from-sky-500/[0.10] via-card to-primary/[0.18] transition-all duration-200 hover:border-sky-300/55 hover:bg-linear-to-br hover:from-sky-500/[0.14] hover:to-primary/[0.22] hover:shadow-[0_12px_24px_-18px_rgba(14,165,233,0.85)] dark:border-sky-400/20 dark:from-sky-400/[0.12] dark:to-sky-500/[0.18] dark:hover:border-sky-400/35"
            aria-label="Развернуть навигацию"
            title="MedSystem"
          >
            <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-[12px] bg-primary text-primary-foreground shadow-sm">
              <Activity className="absolute size-5 transition-all duration-200 group-hover:scale-75 group-hover:opacity-0" />
              <Menu className="absolute size-5 translate-y-1 scale-75 opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100" />
            </span>
          </button>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-3">
              <BrandMark compact={mobile} />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground">MedSystem</p>
                <p className="text-[11px] text-muted-foreground">
                  {mobile ? "Навигация" : "Interactive prototype"}
                </p>
              </div>
            </div>
            {!mobile ? (
              <button
                onClick={onToggleSidebar}
                className="rounded-[10px] p-2 transition-colors hover:bg-accent"
                aria-label="Свернуть навигацию"
              >
                <Menu className="size-5 text-foreground" />
              </button>
            ) : null}
          </>
        )}
      </div>

      <nav className="flex-1 px-2.5 py-3">
        {navItems.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`mb-1 flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 transition-all duration-200 ease-out ${
                isActive
                  ? "border-sky-300/55 bg-sky-500/10 text-sky-900 shadow-[0_10px_24px_-18px_rgba(14,165,233,0.85)] dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-50"
                  : "border-transparent text-muted-foreground hover:border-sky-300/35 hover:bg-sky-500/[0.06] hover:text-foreground dark:hover:border-sky-400/20 dark:hover:bg-sky-400/[0.08] dark:hover:text-sky-50"
              } ${collapsed && !mobile ? "justify-center" : ""}`}
              title={collapsed && !mobile ? item.label : undefined}
            >
              <item.icon className="size-[18px] shrink-0" />
              {!collapsed || mobile ? (
                <span className="flex-1 text-[13px]">{item.label}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {collapsed && !mobile ? (
        <Link
          to="/settings"
          onClick={onNavigate}
          className="mx-2.5 mb-2.5 mt-auto flex items-center justify-center rounded-[10px] border border-transparent px-3 py-2.5 text-muted-foreground transition-all duration-200 ease-out hover:border-sky-300/35 hover:bg-sky-500/[0.06] hover:text-foreground dark:hover:border-sky-400/20 dark:hover:bg-sky-400/[0.08] dark:hover:text-sky-50"
          title={profile.fullName}
          aria-label="Профиль"
        >
          <div className="flex size-[18px] items-center justify-center text-[11px] font-semibold leading-none text-current">
            {profileInitials}
          </div>
        </Link>
      ) : (
        <Link
          to="/settings"
          onClick={onNavigate}
          className="m-2.5 mt-auto flex items-center justify-between gap-3 rounded-[14px] border border-border bg-muted/50 p-3.5 transition-colors hover:bg-accent/60"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {profileInitials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-foreground">
                {profile.fullName}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {profile.specialty}
              </p>
            </div>
          </div>
          <Settings className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      )}
    </>
  );
}

export function Sidebar({
  collapsed,
  layoutMode,
  mobileOpen,
  onToggleSidebar,
  onCloseMobile,
}: SidebarProps) {
  const location = useLocation();

  useEffect(() => {
    if (mobileOpen) {
      onCloseMobile();
    }
  }, [location.pathname]);

  return (
    <>
      <aside
        className={`hidden border-r border-border bg-card md:flex md:flex-col ${
          collapsed ? "md:w-[72px]" : "md:w-64"
        } transition-all duration-300 ${layoutMode === "mobile" ? "md:hidden" : ""}`}
      >
        <SidebarBody
          collapsed={collapsed}
          onToggleSidebar={onToggleSidebar}
        />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]"
            aria-label="Закрыть навигацию"
            onClick={onCloseMobile}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-border bg-card shadow-2xl">
            <SidebarBody
              collapsed={false}
              mobile
              onNavigate={onCloseMobile}
              onToggleSidebar={onCloseMobile}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
