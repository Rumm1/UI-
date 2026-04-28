import { useEffect, useState } from "react";
import {
  Bell,
  Globe,
  Languages,
  Palette,
  RotateCcw,
  Save,
  Settings2,
} from "lucide-react";
import { useAppData } from "../contexts/AppDataContext";
import {
  LanguagePreference,
  ProfileSettings,
  ThemePreference,
} from "../types/medical";
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
    hint: "Показывать мгновенные уведомления прямо в интерфейсе.",
  },
  {
    key: "email",
    label: "Email-уведомления",
    hint: "Дублировать важные события на электронную почту.",
  },
  {
    key: "sms",
    label: "SMS-уведомления",
    hint: "Использовать СМС только для срочных событий.",
  },
  {
    key: "criticalOnly",
    label: "Только критичные",
    hint: "Оставлять только важные и критические сигналы.",
  },
  {
    key: "dailyDigest",
    label: "Ежедневная сводка",
    hint: "Формировать итоговую сводку активности за день.",
  },
];

export function SettingsPage() {
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
  const [applyingPreferences, setApplyingPreferences] = useState(false);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(profile);

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

  async function applyPreferenceChange(
    updater: (current: ProfileSettings) => ProfileSettings,
  ) {
    let nextProfile = profile;

    setForm((current) => {
      nextProfile = updater(current);
      return nextProfile;
    });

    setApplyingPreferences(true);

    try {
      await saveProfile(nextProfile, {
        silent: true,
        emitNotification: false,
      });
    } finally {
      setApplyingPreferences(false);
    }
  }

  function updateWorkingDay(
    dayId: string,
    updater: (
      day: ProfileSettings["workingHours"][number],
    ) => ProfileSettings["workingHours"][number],
  ) {
    setForm((current) => ({
      ...current,
      workingHours: current.workingHours.map((item) =>
        item.id === dayId ? updater(item) : item,
      ),
    }));
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
          <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.25fr]">
            <Skeleton className="h-[520px] rounded-3xl" />
            <Skeleton className="h-[760px] rounded-3xl" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1440px] p-6">
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-semibold text-foreground">
            Настройки
          </h1>
          <p className="text-sm text-muted-foreground">
            Системные параметры интерфейса, предпочтения уведомлений и рабочий
            график.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.25fr]">
          <section className="space-y-4">
            <div className="rounded-3xl border border-border bg-card p-5">
              <div className="mb-5 flex items-start gap-3">
                <div className="flex size-11 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                  <Globe className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Интерфейс
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Язык и тема применяются сразу после выбора.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[14px] border border-border bg-background/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    <Languages className="size-3.5" />
                    Язык
                  </div>
                  <Select
                    value={form.language}
                    onValueChange={(value: LanguagePreference) => {
                      void applyPreferenceChange((current) => ({
                        ...current,
                        language: value,
                      }));
                    }}
                  >
                    <SelectTrigger className="rounded-[12px] border-border bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-[14px] border border-border bg-background/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    <Palette className="size-3.5" />
                    Тема
                  </div>
                  <Select
                    value={form.theme}
                    onValueChange={(value: ThemePreference) => {
                      void applyPreferenceChange((current) => ({
                        ...current,
                        theme: value,
                      }));
                    }}
                  >
                    <SelectTrigger className="rounded-[12px] border-border bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Светлая</SelectItem>
                      <SelectItem value="dark">Темная</SelectItem>
                      <SelectItem value="system">Системная</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                {applyingPreferences
                  ? "Применяем выбранные параметры интерфейса..."
                  : "Режим интерфейса по устройству определяется автоматически по ширине экрана."}
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex size-11 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                  <Settings2 className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Состояние формы
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Контроль синхронизации сохранённых настроек.
                  </p>
                </div>
              </div>

              <div
                className={`rounded-[14px] px-4 py-3 text-sm ${
                  isDirty
                    ? "border border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-900/45 dark:bg-amber-950/25 dark:text-amber-200"
                    : "border border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-900/45 dark:bg-emerald-950/25 dark:text-emerald-200"
                }`}
              >
                {isDirty
                  ? "Есть несохранённые изменения в настройках уведомлений или графика."
                  : "Настройки синхронизированы с последней сохранённой версией."}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex size-11 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                  <RotateCcw className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Сброс демо-данных
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Возвращает прототип к исходному демонстрационному сценарию.
                  </p>
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full rounded-[12px]"
                    disabled={resetting}
                  >
                    <RotateCcw className="size-4" />
                    {resetting ? "Сбрасываем..." : "Сбросить демо-режим"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-3xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Сбросить демо-данные?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Все изменения в mock-слое будут удалены. Это удобно перед
                      новой демонстрацией.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-[12px]">
                      Отмена
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="rounded-[12px]"
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
          </section>

          <section className="space-y-6 rounded-3xl border border-border bg-card p-5">
            <div>
              <div className="mb-5 flex items-start gap-3">
                <div className="flex size-11 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                  <Bell className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Предпочтения уведомлений
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Определяют, как система будет уведомлять о событиях и рисках.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {notificationOptions.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-4 rounded-[14px] border border-border bg-background/60 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.label}
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {item.hint}
                      </p>
                    </div>
                    <Switch
                      checked={form.notifications[item.key]}
                      onCheckedChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          notifications: {
                            ...current.notifications,
                            [item.key]: checked,
                          },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Рабочий график
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {form.workingHours.map((day) => (
                  <div
                    key={day.id}
                    className="rounded-[14px] border border-border bg-background/60 p-4"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {day.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {day.enabled ? "Рабочий день" : "Выходной"}
                        </p>
                      </div>
                      <Switch
                        checked={day.enabled}
                        onCheckedChange={(checked) =>
                          updateWorkingDay(day.id, (current) => ({
                            ...current,
                            enabled: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-[1fr_34px_1fr] items-center gap-2">
                      <Input
                        type="time"
                        value={day.start}
                        disabled={!day.enabled}
                        onChange={(event) =>
                          updateWorkingDay(day.id, (current) => ({
                            ...current,
                            start: event.target.value,
                          }))
                        }
                      />
                      <span className="flex h-10 items-center justify-center rounded-[12px] border border-border bg-background text-muted-foreground">
                        -
                      </span>
                      <Input
                        type="time"
                        value={day.end}
                        disabled={!day.enabled}
                        onChange={(event) =>
                          updateWorkingDay(day.id, (current) => ({
                            ...current,
                            end: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-border pt-6">
              <Button
                variant="outline"
                className="rounded-[12px]"
                disabled={!isDirty}
                onClick={() => setForm(profile)}
              >
                Сбросить
              </Button>
              <Button
                className="rounded-[12px]"
                disabled={!isDirty || saving}
                onClick={() => {
                  void handleSave();
                }}
              >
                <Save className="size-4" />
                {saving ? "Сохраняем..." : "Сохранить настройки"}
              </Button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
