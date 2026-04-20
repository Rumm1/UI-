import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Globe,
  Monitor,
  Languages,
  Palette,
  RotateCcw,
  Save,
  Smartphone,
  Settings2,
  TabletSmartphone,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAppData } from "../contexts/AppDataContext";
import { ProfileSettings } from "../types/medical";
import { StatePanel } from "../components/shared/StatePanel";
import { Skeleton } from "../components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const notificationOptions: Array<{
  key: keyof ProfileSettings["notifications"];
  label: string;
  hint: string;
}> = [
  {
    key: "push",
    label: "Push-уведомления",
    hint: "Показывать мгновенные уведомления в интерфейсе",
  },
  {
    key: "email",
    label: "Email-уведомления",
    hint: "Дублировать важные события на email",
  },
  {
    key: "sms",
    label: "SMS-уведомления",
    hint: "Получать смс по срочным событиям",
  },
  {
    key: "criticalOnly",
    label: "Только критичные",
    hint: "Оставить только high/critical события",
  },
  {
    key: "dailyDigest",
    label: "Ежедневный дайджест",
    hint: "Сводка по активности за день",
  },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const {
    bootstrapError,
    isBootstrapping,
    profile,
    resetDemoData,
    retryBootstrap,
    saveProfile,
  } = useAppData();
  const [form, setForm] = useState<ProfileSettings>(profile);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(profile),
    [form, profile],
  );

  async function handleSave() {
    setSaving(true);
    try {
      await saveProfile(form);
    } finally {
      setSaving(false);
    }
  }

  async function handleResetDemo() {
    setResetting(true);
    try {
      await resetDemoData();
    } finally {
      setResetting(false);
    }
  }

  if (bootstrapError) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <StatePanel
          variant="error"
          title="Не удалось загрузить настройки"
          description={bootstrapError}
          actionLabel="Повторить"
          onAction={() => {
            void retryBootstrap();
          }}
        />
      </main>
    );
  }

  if (isBootstrapping) {
    return (
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1440px] p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-52 rounded-xl" />
            <Skeleton className="h-4 w-72 rounded-xl" />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
            <Skeleton className="h-[720px] rounded-3xl" />
            <Skeleton className="h-[720px] rounded-3xl" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1440px] p-6">
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-semibold text-foreground">Настройки</h1>
          <p className="text-sm text-muted-foreground">
            Editable form state, уведомления, рабочий график и mock theme/language.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center gap-4 border-b border-border pb-6">
              <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                {form.initials}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{form.fullName}</h2>
                <p className="text-sm text-muted-foreground">{form.specialty}</p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => navigate("/notifications")}
                className="flex w-full items-center gap-3 rounded-[10px] border border-border p-4 text-left transition-colors hover:bg-accent/40"
              >
                <div className="flex size-10 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
                  <Bell className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Лента уведомлений</p>
                  <p className="text-xs text-muted-foreground">
                    Открыть системные уведомления
                  </p>
                </div>
              </button>

              <div className="overflow-hidden rounded-[10px] border border-sky-200/50 bg-linear-to-br from-sky-500/[0.05] via-card to-primary/[0.1] p-4 dark:border-sky-400/15 dark:from-sky-400/[0.05] dark:to-sky-500/[0.12]">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-[10px] bg-background/90 text-primary shadow-sm ring-1 ring-sky-200/40 dark:bg-background/60 dark:ring-sky-400/20">
                    <Globe className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Локализация</p>
                    <p className="text-xs text-muted-foreground">
                      Переключение языка и темы оформлено как отдельный системный модуль.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[10px] border border-white/50 bg-background/75 p-3 shadow-sm dark:border-white/8 dark:bg-background/35">
                    <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      <Languages className="size-3.5" />
                      Язык
                    </div>
                    <Select
                      value={form.language}
                      onValueChange={(value: "ru" | "en") =>
                        setForm((current) => ({ ...current, language: value }))
                      }
                    >
                      <SelectTrigger className="rounded-[10px] border-border bg-background/90">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="en">Английский</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-[10px] border border-white/50 bg-background/75 p-3 shadow-sm dark:border-white/8 dark:bg-background/35">
                    <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      <Palette className="size-3.5" />
                      Тема
                    </div>
                    <Select
                      value={form.theme}
                      onValueChange={(value: "light" | "dark" | "system") =>
                        setForm((current) => ({ ...current, theme: value }))
                      }
                    >
                      <SelectTrigger className="rounded-[10px] border-border bg-background/90">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Светлая</SelectItem>
                        <SelectItem value="dark">Темная</SelectItem>
                        <SelectItem value="system">Системная</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-[10px] border border-white/50 bg-background/75 p-3 shadow-sm dark:border-white/8 dark:bg-background/35">
                    <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      <Monitor className="size-3.5" />
                      Режим
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { value: "desktop", label: "ПК", icon: Monitor },
                        { value: "tablet", label: "Планшет", icon: TabletSmartphone },
                        { value: "mobile", label: "Мобайл", icon: Smartphone },
                      ] as const).map((mode) => {
                        const isActive = form.interfaceMode === mode.value;

                        return (
                          <button
                            key={mode.value}
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                interfaceMode: mode.value,
                              }))
                            }
                            className={`flex h-[72px] flex-col items-center justify-center gap-1 rounded-[10px] border text-[11px] font-medium transition-colors ${
                              isActive
                                ? "border-sky-300/55 bg-sky-500/10 text-sky-900 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-50"
                                : "border-border bg-background/85 text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                            }`}
                          >
                            <mode.icon className="size-4" />
                            <span>{mode.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[10px] border border-border p-4">
                <div className="mb-3 flex items-center gap-3">
                  <Settings2 className="size-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Состояние формы</p>
                    <p className="text-xs text-muted-foreground">
                      {isDirty ? "Есть несохраненные изменения" : "Изменений нет"}
                    </p>
                  </div>
                </div>
                <div
                  className={`rounded-[10px] px-3 py-2 text-sm ${
                    isDirty ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {isDirty
                    ? "Кнопка сохранения активна, потому что данные изменены."
                    : "Кнопка сохранения отключена, пока форма совпадает с сохраненным профилем."}
                </div>
              </div>

              <div className="rounded-[10px] border border-border p-4">
                <div className="mb-3 flex items-center gap-3">
                  <RotateCcw className="size-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Сброс демо-данных</p>
                    <p className="text-xs text-muted-foreground">
                      Возвращает пациентов, приемы, записи, назначения и уведомления к начальному сценарию.
                    </p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full rounded-[10px]"
                      disabled={resetting}
                    >
                      <RotateCcw className="mr-2 size-4" />
                      {resetting ? "Сбрасываем..." : "Сбросить демо-режим"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Сбросить демо-данные?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Все изменения в mock-слое будут удалены. Это удобно перед новой презентацией.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-[10px]">Отмена</AlertDialogCancel>
                      <AlertDialogAction
                        className="rounded-[10px]"
                        onClick={() => {
                          void handleResetDemo();
                        }}
                      >
                        Сбросить данные
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center gap-3">
              <UserRound className="size-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Профиль врача</h2>
                <p className="text-sm text-muted-foreground">
                  Изменения сохраняются в mock-store после нажатия кнопки сохранения.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Имя</Label>
                <Input
                  value={form.firstName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      firstName: event.target.value,
                      fullName: `${event.target.value} ${current.lastName}`.trim(),
                      initials: `${event.target.value[0] ?? ""}${current.lastName[0] ?? ""}`.toUpperCase(),
                    }))
                  }
                />
              </div>
              <div>
                <Label>Фамилия</Label>
                <Input
                  value={form.lastName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      lastName: event.target.value,
                      fullName: `${current.firstName} ${event.target.value}`.trim(),
                      initials: `${current.firstName[0] ?? ""}${event.target.value[0] ?? ""}`.toUpperCase(),
                    }))
                  }
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Телефон</Label>
                <Input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Специальность</Label>
                <Input
                  value={form.specialty}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, specialty: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Клиника</Label>
                <Input
                  value={form.clinic}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, clinic: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Часовой пояс</Label>
                <Input
                  value={form.timezone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, timezone: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Роль</Label>
                <Input
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, role: event.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>Лицензия</Label>
                <Input
                  value={form.licenseNumber}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, licenseNumber: event.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>О себе</Label>
                <Textarea
                  rows={4}
                  value={form.bio}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, bio: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="my-6 border-t border-border pt-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Уведомления</h3>
              <div className="space-y-3">
                {notificationOptions.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-[10px] border border-border p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.hint}</p>
                    </div>
                    <Switch
                      checked={form.notifications[item.key]}
                      onCheckedChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          notifications: { ...current.notifications, [item.key]: checked },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Рабочий график</h3>
              <div className="space-y-3">
                {form.workingHours.map((day) => (
                  <div
                    key={day.id}
                    className="grid gap-3 rounded-[10px] border border-border p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="flex items-center gap-3 rounded-[10px] bg-muted/35 px-3 py-3">
                      <Switch
                        checked={day.enabled}
                        onCheckedChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            workingHours: current.workingHours.map((item) =>
                              item.id === day.id ? { ...item, enabled: checked } : item,
                            ),
                          }))
                        }
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{day.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {day.enabled ? "Рабочий день" : "Выходной"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-[132px_40px_132px] items-center gap-2 rounded-[10px] bg-muted/40 px-2 py-2">
                      <Input
                        type="time"
                        value={day.start}
                        disabled={!day.enabled}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            workingHours: current.workingHours.map((item) =>
                              item.id === day.id ? { ...item, start: event.target.value } : item,
                            ),
                          }))
                        }
                        className="w-[132px]"
                      />
                      <span className="flex h-9 items-center justify-center rounded-[10px] border border-border bg-background text-muted-foreground">
                        —
                      </span>
                      <Input
                        type="time"
                        value={day.end}
                        disabled={!day.enabled}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            workingHours: current.workingHours.map((item) =>
                              item.id === day.id ? { ...item, end: event.target.value } : item,
                            ),
                          }))
                        }
                        className="w-[132px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                className="rounded-[10px]"
                disabled={!isDirty}
                onClick={() => setForm(profile)}
              >
                Сбросить
              </Button>
              <Button
                className="rounded-[10px]"
                disabled={!isDirty || saving}
                onClick={() => {
                  void handleSave();
                }}
              >
                <Save className="mr-2 size-4" />
                {saving ? "Сохраняем..." : "Сохранить настройки"}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
