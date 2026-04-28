import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  ChevronDown,
  Languages,
  LogOut,
  Maximize2,
  Menu,
  Minimize2,
  Search,
  Settings2,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAppData } from "../contexts/AppDataContext";
import { ProfileAvatar } from "../lib/profileAvatar";
import type { LanguagePreference } from "../types/medical";
import { NotificationDropdown } from "./NotificationDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface HeaderProps {
  layoutMode: "mobile" | "tablet" | "desktop";
  onOpenMobileSidebar: () => void;
}

const languageOptions: Array<{
  value: LanguagePreference;
  label: string;
}> = [
  {
    value: "ru",
    label: "Русский",
  },
  {
    value: "en",
    label: "English",
  },
];

const profileMenuItems = [
  {
    label: "Профиль",
    path: "/profile",
    icon: UserRound,
  },
  {
    label: "Уведомления",
    path: "/notifications",
    icon: Bell,
  },
  {
    label: "Настройки",
    path: "/settings",
    icon: Settings2,
  },
];

export function Header({ layoutMode, onOpenMobileSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const { profile, saveProfile } = useAppData();
  const [query, setQuery] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const isMobile = layoutMode === "mobile";
  const isCompact = layoutMode !== "desktop";

  useEffect(() => {
    function syncFullscreenState() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    navigate(
      trimmedQuery ? `/patients?query=${encodeURIComponent(trimmedQuery)}` : "/patients",
    );
  }

  async function handleSelectLanguage(nextLanguage: LanguagePreference) {
    if (savingLanguage || nextLanguage === profile.language) {
      return;
    }

    setSavingLanguage(true);

    try {
      await saveProfile(
        {
          ...profile,
          language: nextLanguage,
        },
        {
          silent: true,
          emitNotification: false,
        },
      );
      setIsLanguageMenuOpen(false);
    } finally {
      setSavingLanguage(false);
    }
  }

  async function handleToggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await document.documentElement.requestFullscreen();
    } catch {
      // Ignore fullscreen API failures silently.
    }
  }

  function handleLogout() {
    toast.success("Вы вышли из аккаунта", {
      description: "Демо-сессия завершена, интерфейс переведён на главную страницу.",
    });
    navigate("/", { replace: true });
  }

  return (
    <header
      className={`sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/90 backdrop-blur ${
        isCompact ? "px-3.5" : "px-4 md:px-5"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {isMobile ? (
          <>
            <button
              onClick={onOpenMobileSidebar}
              className="flex size-10 items-center justify-center rounded-[12px] border border-transparent transition-colors hover:border-border hover:bg-accent"
              aria-label="Открыть навигацию"
            >
              <Menu className="size-4 text-foreground" />
            </button>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-foreground">MedSystem</p>
              <p className="text-[11px] text-muted-foreground">
                Медицинская система
              </p>
            </div>
          </>
        ) : (
          <form
            onSubmit={handleSubmit}
            className={`hidden flex-1 md:block ${isCompact ? "max-w-lg" : "max-w-xl"}`}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-[15px] -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск пациента, диагноза или записи"
                className="h-10 w-full rounded-[12px] border border-border bg-background pl-9 pr-4 text-[13px] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </form>
        )}
      </div>

      <div
        className={`flex shrink-0 items-center ${isCompact ? "gap-2" : "gap-3"}`}
      >
        <DropdownMenu open={isLanguageMenuOpen} onOpenChange={setIsLanguageMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={savingLanguage}
              className="flex h-10 items-center gap-2 rounded-[12px] border border-border bg-background px-3 text-[12px] font-semibold text-foreground transition-colors hover:bg-accent disabled:opacity-60"
              aria-label="Выбор языка"
              title="Выбор языка"
            >
              <Languages className="size-4 text-muted-foreground" />
              <span>{profile.language.toUpperCase()}</span>
              <ChevronDown
                className={`size-3.5 text-muted-foreground transition-transform duration-200 ${
                  isLanguageMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[220px] rounded-[14px] border-border bg-card p-2 shadow-[0_24px_48px_-28px_rgba(15,23,42,0.38)]"
          >
            <DropdownMenuLabel className="px-2 pb-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">
              Язык интерфейса
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={profile.language}
              onValueChange={(value) => {
                void handleSelectLanguage(value as LanguagePreference);
              }}
            >
              {languageOptions.map((option) => (
                <DropdownMenuRadioItem
                  key={option.value}
                  value={option.value}
                  disabled={savingLanguage}
                  className="rounded-[10px] py-2 pl-8 pr-3"
                >
                  <span className="text-[13px] font-medium text-foreground">
                    {option.label}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {!isMobile ? (
          <button
            type="button"
            onClick={() => {
              void handleToggleFullscreen();
            }}
            className="flex size-10 items-center justify-center rounded-[12px] border border-border bg-background text-foreground transition-colors hover:bg-accent"
            aria-label={
              isFullscreen
                ? "Выйти из полноэкранного режима"
                : "Открыть на весь экран"
            }
            title={
              isFullscreen
                ? "Выйти из полноэкранного режима"
                : "Открыть на весь экран"
            }
          >
            {isFullscreen ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </button>
        ) : null}

        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`flex items-center gap-3 rounded-[14px] bg-muted/55 transition-colors hover:bg-accent/65 ${
                isMobile ? "px-2.5 py-2" : "px-3 py-2.5"
              }`}
              aria-label="Меню профиля"
            >
              <ProfileAvatar
                avatarPreset={profile.avatarPreset}
                avatarImage={profile.avatarImage}
                fullName={profile.fullName}
                className="size-10 shrink-0"
                iconClassName="size-[18px]"
              />

              {!isMobile ? (
                <>
                  <div className="min-w-0 max-w-[160px] text-left">
                    <p className="truncate text-[13px] font-semibold text-foreground">
                      {profile.fullName}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {profile.specialty}
                    </p>
                  </div>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </>
              ) : null}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-[220px] rounded-[14px] border-border bg-card p-1.5 shadow-[0_24px_48px_-28px_rgba(15,23,42,0.38)]"
          >
            <DropdownMenuLabel className="px-2.5 py-2.5">
              <div className="flex items-center gap-3">
                <ProfileAvatar
                  avatarPreset={profile.avatarPreset}
                  avatarImage={profile.avatarImage}
                  fullName={profile.fullName}
                  className="size-12"
                  iconClassName="size-5"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {profile.fullName}
                  </p>
                  <p className="truncate text-xs font-normal text-muted-foreground">
                    {profile.specialty}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {profileMenuItems.map((item) => {
              const Icon = item.icon;

              return (
                <DropdownMenuItem
                  key={item.path}
                  className="cursor-pointer gap-2.5 rounded-[12px] px-2.5 py-2"
                  onSelect={() => {
                    navigate(item.path);
                  }}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <span className="text-[13px] font-medium text-foreground">
                    {item.label}
                  </span>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer gap-2.5 rounded-[12px] px-2.5 py-2"
              onSelect={handleLogout}
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-destructive/10 text-destructive">
                <LogOut className="size-4" />
              </div>
              <span className="text-[13px] font-medium">Выйти из аккаунта</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
