import { FormEvent, useState } from "react";
import { Search, Settings } from "lucide-react";
import { useNavigate } from "react-router";
import { NotificationDropdown } from "./NotificationDropdown";

export function Header() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    navigate(trimmedQuery ? `/patients?query=${encodeURIComponent(trimmedQuery)}` : "/patients");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur md:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <form onSubmit={handleSubmit} className="hidden max-w-xl flex-1 md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-[15px] -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск пациента, диагноза или записи"
              className="h-10 w-full rounded-[10px] border border-border bg-background pl-9 pr-4 text-[13px] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </form>
      </div>

      <div className="flex items-center gap-3">
        <NotificationDropdown />
        <div className="hidden h-7 w-px bg-border md:block" />
        <button
          onClick={() => navigate("/settings")}
          className="flex size-10 items-center justify-center rounded-[10px] transition-colors hover:bg-accent"
          aria-label="Настройки"
        >
          <Settings className="size-4 text-foreground" />
        </button>
      </div>
    </header>
  );
}
