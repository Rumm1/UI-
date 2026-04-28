import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  Activity,
  Calendar,
  FileText,
  House,
  Menu,
  Pill,
  Users,
} from "lucide-react";

const navItems = [
  { icon: House, label: "Главное", path: "/" },
  { icon: Users, label: "Пациенты", path: "/patients" },
  { icon: Calendar, label: "Записи", path: "/appointments" },
  { icon: FileText, label: "Медкарты", path: "/records" },
  { icon: Pill, label: "Назначения", path: "/prescriptions" },
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

  return (
    <>
      <div
        className={`border-b border-border ${
          collapsed && !mobile
            ? "flex h-16 items-center justify-center px-3"
            : "flex h-16 items-center justify-between gap-3 px-4"
        }`}
      >
        {collapsed && !mobile ? (
          <button
            onClick={onToggleSidebar}
            className="group flex size-12 items-center justify-center rounded-[16px] border border-primary/15 bg-linear-to-br from-primary/[0.06] via-card to-primary/[0.12] transition-all duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-primary/25 hover:from-primary/[0.08] hover:to-primary/[0.16]"
            aria-label="Развернуть навигацию"
            title="MedSystem"
          >
            <span className="relative flex size-10 items-center justify-center overflow-hidden rounded-[12px] bg-primary text-primary-foreground shadow-sm">
              <Activity className="absolute size-5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-75 group-hover:opacity-0" />
              <Menu className="absolute size-5 translate-y-1 scale-75 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100" />
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
                className="flex size-10 items-center justify-center rounded-[12px] transition-colors hover:bg-accent"
                aria-label="Свернуть навигацию"
              >
                <Menu className="size-5 text-foreground" />
              </button>
            ) : null}
          </>
        )}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2.5 py-3">
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
              className={`mb-1 flex items-center gap-2.5 rounded-[10px] border px-3 py-2.5 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isActive
                  ? "border-primary/40 bg-primary/12 text-foreground"
                  : "border-transparent text-muted-foreground hover:border-primary/25 hover:bg-primary/[0.06] hover:text-foreground dark:hover:border-primary/20 dark:hover:bg-primary/[0.08] dark:hover:text-foreground"
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
  const [mobileRendered, setMobileRendered] = useState(mobileOpen);

  useEffect(() => {
    if (mobileOpen) {
      setMobileRendered(true);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMobileRendered(false);
    }, 360);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (mobileOpen) {
      onCloseMobile();
    }
  }, [location.pathname]);

  return (
    <>
      <aside
        className={`hidden h-screen shrink-0 overflow-hidden border-r border-border bg-card md:sticky md:top-0 md:flex md:flex-col transition-[width] duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          collapsed ? "md:w-[72px]" : "md:w-64"
        } ${layoutMode === "mobile" ? "md:hidden" : ""}`}
      >
        <SidebarBody
          collapsed={collapsed}
          onToggleSidebar={onToggleSidebar}
        />
      </aside>

      {mobileRendered ? (
        <div
          className={`fixed inset-0 z-40 md:hidden ${
            mobileOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <button
            type="button"
            className={`absolute inset-0 bg-slate-950/35 backdrop-blur-[2px] transition-opacity duration-[360ms] ease-out ${
              mobileOpen ? "opacity-100" : "opacity-0"
            }`}
            aria-label="Закрыть навигацию"
            onClick={onCloseMobile}
          />
          <aside
            className={`absolute inset-y-0 left-0 flex h-screen w-[280px] flex-col overflow-hidden border-r border-border bg-card shadow-2xl transition-transform duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
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
