import { FormEvent, useState } from "react";
import { Menu, Search } from "lucide-react";
import { useNavigate } from "react-router";
import { useAppData } from "../contexts/AppDataContext";
import { NotificationDropdown } from "./NotificationDropdown";

interface HeaderProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function Header({ sidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const { profile } = useAppData();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    navigate(trimmedQuery ? `/patients?query=${encodeURIComponent(trimmedQuery)}` : "/patients");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-2xl p-2 transition-colors hover:bg-accent"
          aria-label={sidebarCollapsed ? "Развернуть навигацию" : "Свернуть навигацию"}
        >
          <Menu className="size-5 text-foreground" />
        </button>

        <form onSubmit={handleSubmit} className="hidden max-w-xl flex-1 md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск пациента, диагноза или записи"
              className="h-11 w-full rounded-2xl border border-border bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-4">
        <NotificationDropdown />
        <div className="hidden h-8 w-px bg-border md:block" />
        <button
          onClick={() => navigate("/settings")}
          className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors hover:bg-accent"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {profile.initials || "ИИ"}
          </div>
          <div className="hidden text-left md:block">
            <div className="text-sm font-medium text-foreground">{profile.fullName}</div>
            <div className="text-xs text-muted-foreground">{profile.specialty}</div>
          </div>
        </button>
      </div>
    </header>
  );
}
