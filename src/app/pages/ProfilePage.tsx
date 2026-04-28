import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  BadgeCheck,
  BellRing,
  Building2,
  CalendarDays,
  Camera,
  Clock3,
  FileText,
  KeyRound,
  Mail,
  PencilLine,
  Phone,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAppData } from "../contexts/AppDataContext";
import { formatDisplayDateTime, getInitials } from "../lib/prototype";
import {
  getProfileAvatarOption,
  profileAvatarOptions,
} from "../lib/profileAvatar";
import {
  ProfileAvatarPreset,
  ProfileSettings,
} from "../types/medical";
import { StatePanel } from "../components/shared/StatePanel";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Skeleton } from "../components/ui/skeleton";
import { Textarea } from "../components/ui/textarea";

const emptyPasswordForm = {
  currentPassword: "",
  nextPassword: "",
  confirmPassword: "",
};

interface MetricCardItem {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}

interface InfoCardItem {
  label: string;
  value: string;
  icon: LucideIcon;
}

function buildIdentity(profile: ProfileSettings) {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();

  return {
    fullName,
    initials: getInitials(fullName) || profile.initials || "ИИ",
  };
}

function formatWorkingDayValue(day: ProfileSettings["workingHours"][number]) {
  return day.enabled ? `${day.start} - ${day.end}` : "Выходной";
}

function getWorkingWindowLabel(workingHours: ProfileSettings["workingHours"]) {
  const enabledDays = workingHours.filter((day) => day.enabled);

  if (enabledDays.length === 0) {
    return "Не задано";
  }

  const starts = enabledDays.map((day) => day.start).sort();
  const ends = enabledDays.map((day) => day.end).sort();

  return `${starts[0]} - ${ends[ends.length - 1]}`;
}

export function ProfilePage() {
  const {
    appointments,
    bootstrapError,
    isBootstrapping,
    notifications,
    patients,
    profile,
    records,
    retryBootstrap,
    saveProfile,
    tasks,
  } = useAppData();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProfileSettings>(profile);
  const [avatarDraft, setAvatarDraft] = useState<ProfileAvatarPreset>(
    profile.avatarPreset,
  );
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);

  useEffect(() => {
    setEditForm(profile);
    setAvatarDraft(profile.avatarPreset);
  }, [profile]);

  useEffect(() => {
    if (!securityDialogOpen) {
      setPasswordForm(emptyPasswordForm);
      setPasswordError(null);
    }
  }, [securityDialogOpen]);

  const avatarOption = getProfileAvatarOption(profile.avatarPreset);
  const AvatarIcon = avatarOption.icon;
  const passwordUpdatedLabel = profile.passwordUpdatedAt
    ? formatDisplayDateTime(profile.passwordUpdatedAt)
    : "Не обновлялся";
  const enabledWorkingDays = profile.workingHours.filter((day) => day.enabled);
  const workingWindowLabel = getWorkingWindowLabel(profile.workingHours);
  const enabledNotificationCount = [
    profile.notifications.push,
    profile.notifications.email,
    profile.notifications.sms,
  ].filter(Boolean).length;
  const activePatientsCount = patients.filter(
    (patient) => patient.status === "active",
  ).length;
  const upcomingAppointmentsCount = appointments.filter((appointment) => {
    const startsAt = new Date(appointment.startAt).getTime();

    return (
      startsAt >= Date.now() &&
      (appointment.status === "pending" || appointment.status === "confirmed")
    );
  }).length;
  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length;
  const openTasksCount = tasks.filter((task) => !task.completed).length;
  const recordsInProgressCount = records.filter(
    (record) => record.status !== "final",
  ).length;
  const workItemsCount = openTasksCount + recordsInProgressCount;

  const heroMetrics: MetricCardItem[] = [
    {
      label: "Активные пациенты",
      value: String(activePatientsCount),
      hint: `${patients.length} в общей базе`,
      icon: Users,
    },
    {
      label: "Ближайшие приёмы",
      value: String(upcomingAppointmentsCount),
      hint: "подтверждённые и ожидающие",
      icon: CalendarDays,
    },
    {
      label: "В работе",
      value: String(workItemsCount),
      hint:
        workItemsCount === 0
          ? "все задачи и записи закрыты"
          : `${openTasksCount} задач и ${recordsInProgressCount} записей`,
      icon: FileText,
    },
    {
      label: "Сигналы",
      value: String(unreadNotificationsCount),
      hint:
        unreadNotificationsCount === 0
          ? "всё просмотрено"
          : "требуют внимания",
      icon: BellRing,
    },
  ];

  const infoCards: InfoCardItem[] = [
    {
      label: "Email",
      value: profile.email,
      icon: Mail,
    },
    {
      label: "Телефон",
      value: profile.phone,
      icon: Phone,
    },
    {
      label: "Клиника",
      value: profile.clinic,
      icon: Building2,
    },
    {
      label: "Часовой пояс",
      value: profile.timezone,
      icon: Clock3,
    },
    {
      label: "Роль",
      value: profile.role,
      icon: BadgeCheck,
    },
    {
      label: "Лицензия",
      value: profile.licenseNumber,
      icon: ShieldCheck,
    },
  ];

  const setupCards: MetricCardItem[] = [
    {
      label: "Окно приёма",
      value: workingWindowLabel,
      hint: "основной рабочий диапазон",
      icon: Clock3,
    },
    {
      label: "Рабочие дни",
      value: `${enabledWorkingDays.length} из ${profile.workingHours.length}`,
      hint: "активные дни недели",
      icon: CalendarDays,
    },
    {
      label: "Каналы связи",
      value: String(enabledNotificationCount),
      hint: "push, email и sms",
      icon: BellRing,
    },
  ];

  const notificationChannels = [
    {
      label: "Push-уведомления",
      hint: "Сигналы появляются сразу в интерфейсе.",
      enabled: profile.notifications.push,
    },
    {
      label: "Email-уведомления",
      hint: "Ключевые события дублируются на почту.",
      enabled: profile.notifications.email,
    },
    {
      label: "SMS-уведомления",
      hint: "Используются только для срочных кейсов.",
      enabled: profile.notifications.sms,
    },
    {
      label: "Ежедневная сводка",
      hint: "Итог активности за день в одном сообщении.",
      enabled: profile.notifications.dailyDigest,
    },
  ];

  async function handleSaveAvatar() {
    if (avatarDraft === profile.avatarPreset) {
      setAvatarDialogOpen(false);
      return;
    }

    setSavingAvatar(true);

    try {
      await saveProfile({
        ...profile,
        avatarPreset: avatarDraft,
      });
      setAvatarDialogOpen(false);
    } finally {
      setSavingAvatar(false);
    }
  }

  async function handleSaveProfile() {
    const identity = buildIdentity(editForm);
    const nextProfile: ProfileSettings = {
      ...editForm,
      fullName: identity.fullName,
      initials: identity.initials,
    };

    setSavingProfile(true);

    try {
      await saveProfile(nextProfile);
      setEditDialogOpen(false);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSavePassword() {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.nextPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordError("Заполните все поля для смены пароля.");
      return;
    }

    if (passwordForm.nextPassword.length < 8) {
      setPasswordError("Новый пароль должен содержать минимум 8 символов.");
      return;
    }

    if (passwordForm.nextPassword !== passwordForm.confirmPassword) {
      setPasswordError("Подтверждение пароля не совпадает.");
      return;
    }

    setSavingPassword(true);
    setPasswordError(null);

    try {
      await saveProfile({
        ...profile,
        passwordUpdatedAt: new Date().toISOString(),
      });
      setSecurityDialogOpen(false);
    } finally {
      setSavingPassword(false);
    }
  }

  if (bootstrapError) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <StatePanel
          variant="error"
          title="Не удалось загрузить профиль"
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
            <Skeleton className="h-8 w-44 rounded-xl" />
            <Skeleton className="h-4 w-80 rounded-xl" />
          </div>
          <Skeleton className="mt-6 h-[420px] rounded-[32px]" />
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Skeleton className="h-[360px] rounded-[28px]" />
            <Skeleton className="h-[520px] rounded-[28px]" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1440px] p-6">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-medical-display text-2xl font-semibold text-foreground">
              Профиль
            </h1>
            <p className="text-sm text-muted-foreground">
              Личный кабинет врача, данные аккаунта и параметры безопасности.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-primary/15 bg-primary/[0.08] px-3 py-1 text-xs font-medium text-primary">
              {enabledWorkingDays.length} рабочих дней
            </span>
            <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              {enabledNotificationCount} активных канала связи
            </span>
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[32px] border border-primary/15 bg-linear-to-br from-card via-card to-primary/[0.08] p-6 shadow-[0_24px_80px_-48px_rgba(47,159,203,0.65)]">
          <div className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-sky-200/45 blur-3xl dark:bg-sky-400/10" />

          <div className="relative grid gap-6 xl:grid-cols-[320px_1fr]">
            <aside className="rounded-[28px] border border-white/70 bg-white/70 p-5 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-primary/15 bg-primary/[0.08] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary">
                  Рабочий профиль
                </span>
                <div className="flex size-10 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                  <ShieldCheck className="size-4" />
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <div className="rounded-full border border-white/80 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
                  <div
                    className={`flex size-28 items-center justify-center rounded-full ${avatarOption.className}`}
                  >
                    <AvatarIcon className="size-12" />
                  </div>
                </div>
              </div>

              <div className="mt-5 text-center">
                <h2 className="font-medical-display text-2xl font-semibold text-foreground">
                  {profile.fullName}
                </h2>
                <p className="mt-1 text-sm font-medium text-foreground/90">
                  {profile.specialty}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.clinic}
                </p>
              </div>

              <Button
                variant="outline"
                className="mt-6 w-full rounded-[14px] border-white/70 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.08]"
                onClick={() => setAvatarDialogOpen(true)}
              >
                <Camera className="size-4" />
                Сменить иконку
              </Button>

              <div className="mt-4 rounded-[20px] border border-primary/15 bg-primary/[0.08] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-[12px] bg-primary/12 text-primary">
                    <KeyRound className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Безопасность аккаунта
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Пароль обновлён: {passwordUpdatedLabel}
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="mt-4 w-full rounded-[14px] border-primary/15 bg-white/70 hover:bg-white dark:bg-white/[0.05] dark:hover:bg-white/[0.08]"
                  onClick={() => setSecurityDialogOpen(true)}
                >
                  <KeyRound className="size-4" />
                  Сменить пароль
                </Button>
              </div>
            </aside>

            <div className="flex flex-col justify-between rounded-[28px] border border-white/55 bg-white/45 p-6 backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.03]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-primary/15 bg-primary/[0.08] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary">
                    Панель врача
                  </span>
                  <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-medium text-muted-foreground dark:border-white/10 dark:bg-white/[0.05]">
                    {profile.role}
                  </span>
                </div>

                <h2 className="mt-4 font-medical-display text-4xl font-semibold leading-none tracking-[-0.03em] text-foreground sm:text-5xl">
                  {profile.fullName}
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                  {profile.bio}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    profile.specialty,
                    profile.clinic,
                    profile.timezone,
                    `Лицензия ${profile.licenseNumber}`,
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-medium text-foreground dark:border-white/10 dark:bg-white/[0.05]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="rounded-[14px]"
                    onClick={() => setEditDialogOpen(true)}
                  >
                    <PencilLine className="size-4" />
                    Редактировать профиль
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-[14px] border-white/70 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/[0.08]"
                  >
                    <Link to="/settings">Открыть настройки</Link>
                  </Button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {heroMetrics.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className="rounded-[22px] border border-white/70 bg-white/70 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                            {item.label}
                          </span>
                          <div className="flex size-9 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
                            <Icon className="size-4" />
                          </div>
                        </div>
                        <p className="mt-4 font-medical-display text-3xl font-semibold leading-none text-foreground">
                          {item.value}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {item.hint}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-primary">
                    Контакты и доступ
                  </p>
                  <h3 className="mt-2 font-medical-display text-2xl font-semibold text-foreground">
                    Идентификация профиля
                  </h3>
                </div>
                <div className="rounded-[16px] border border-primary/15 bg-primary/[0.08] px-3 py-2 text-right">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-primary">
                    Статус
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    Активный кабинет
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {infoCards.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-[20px] border border-border/70 bg-background/70 p-4"
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
                          <Icon className="size-4" />
                        </div>
                        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          {item.label}
                        </span>
                      </div>
                      <p className="break-words text-sm font-medium text-foreground">
                        {item.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-primary">
                  Текущий ритм
                </p>
                <h3 className="mt-2 font-medical-display text-2xl font-semibold text-foreground">
                  Рабочий контекст профиля
                </h3>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {setupCards.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-[20px] border border-border/70 bg-background/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          {item.label}
                        </span>
                        <div className="flex size-9 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
                          <Icon className="size-4" />
                        </div>
                      </div>
                      <p className="mt-4 font-medical-display text-2xl font-semibold leading-none text-foreground">
                        {item.value}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        {item.hint}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-[22px] border border-primary/15 bg-linear-to-br from-primary/[0.08] via-background to-background p-5">
                <p className="text-sm leading-7 text-foreground">
                  Профиль настроен для приёма в интервале {workingWindowLabel},
                  активно {enabledWorkingDays.length} рабочих дней, открыто{" "}
                  {openTasksCount} задач, {recordsInProgressCount} записей в
                  работе и {unreadNotificationsCount} уведомлений, требующих
                  внимания.
                </p>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-primary">
                    Безопасность и уведомления
                  </p>
                  <h3 className="mt-2 font-medical-display text-2xl font-semibold text-foreground">
                    Контроль доступа
                  </h3>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/55 dark:bg-emerald-950/30 dark:text-emerald-200">
                  Профиль защищён
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-primary/15 bg-primary/[0.08] p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-primary">
                    Последнее обновление
                  </p>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {passwordUpdatedLabel}
                  </p>
                </div>
                <div className="rounded-[20px] border border-border/70 bg-background/70 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                    Режим оповещений
                  </p>
                  <p className="mt-3 text-sm font-medium text-foreground">
                    {profile.notifications.criticalOnly
                      ? "Только приоритетные сигналы"
                      : "Все уведомления"}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {notificationChannels.map((channel) => (
                  <div
                    key={channel.label}
                    className="flex items-center justify-between gap-4 rounded-[18px] border border-border/70 bg-background/70 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {channel.label}
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {channel.hint}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        channel.enabled
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {channel.enabled ? "Вкл." : "Выкл."}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-primary">
                    Рабочий график
                  </p>
                  <h3 className="mt-2 font-medical-display text-2xl font-semibold text-foreground">
                    Неделя по дням
                  </h3>
                </div>
                <div className="rounded-[16px] border border-primary/15 bg-primary/[0.08] px-3 py-2 text-right">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-primary">
                    Окно
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {workingWindowLabel}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {profile.workingHours.map((day) => (
                  <div
                    key={day.id}
                    className={`flex items-center justify-between gap-4 rounded-[18px] border px-4 py-3 ${
                      day.enabled
                        ? "border-border/70 bg-background/70"
                        : "border-dashed border-border/70 bg-muted/30"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {day.label}
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {day.enabled ? "Рабочий день" : "Выходной"}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        day.enabled
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {formatWorkingDayValue(day)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Сменить иконку профиля</DialogTitle>
            <DialogDescription>
              Выберите иконку, которая будет показана в профиле и в верхнем меню.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            {profileAvatarOptions.map((option) => {
              const OptionIcon = option.icon;
              const isActive = avatarDraft === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAvatarDraft(option.value)}
                  className={`flex items-center gap-4 rounded-[16px] border p-4 text-left transition-colors ${
                    isActive
                      ? "border-primary/35 bg-primary/[0.08]"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <div
                    className={`flex size-14 shrink-0 items-center justify-center rounded-[16px] ${option.className}`}
                  >
                    <OptionIcon className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {option.label}
                    </p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-[12px]"
              onClick={() => setAvatarDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              className="rounded-[12px]"
              disabled={savingAvatar}
              onClick={() => {
                void handleSaveAvatar();
              }}
            >
              {savingAvatar ? "Сохраняем..." : "Сохранить иконку"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={securityDialogOpen} onOpenChange={setSecurityDialogOpen}>
        <DialogContent className="max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Безопасность аккаунта</DialogTitle>
            <DialogDescription>
              Обновите пароль для доступа к кабинету. Последнее изменение:{" "}
              {passwordUpdatedLabel}.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-[18px] border border-border bg-muted/35 p-4">
            <div className="space-y-4">
              <div>
                <Label>Текущий пароль</Label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Новый пароль</Label>
                <Input
                  type="password"
                  value={passwordForm.nextPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      nextPassword: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Подтверждение пароля</Label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              После сохранения система обновит отметку о последнем изменении
              безопасности аккаунта.
            </p>
          </div>

          {passwordError ? (
            <div className="rounded-[12px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {passwordError}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-[12px]"
              onClick={() => setSecurityDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              className="rounded-[12px]"
              disabled={savingPassword}
              onClick={() => {
                void handleSavePassword();
              }}
            >
              {savingPassword ? "Сохраняем..." : "Сменить пароль"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Редактировать профиль</DialogTitle>
            <DialogDescription>
              Обновите основные данные аккаунта.
            </DialogDescription>
          </DialogHeader>

          <div>
            <h3 className="mb-4 text-base font-semibold text-foreground">
              Данные аккаунта
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Имя</Label>
                <Input
                  value={editForm.firstName}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      firstName: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Фамилия</Label>
                <Input
                  value={editForm.lastName}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      lastName: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={editForm.email}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Телефон</Label>
                <Input
                  value={editForm.phone}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Специальность</Label>
                <Input
                  value={editForm.specialty}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      specialty: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Роль</Label>
                <Input
                  value={editForm.role}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Клиника</Label>
                <Input
                  value={editForm.clinic}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      clinic: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Часовой пояс</Label>
                <Input
                  value={editForm.timezone}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      timezone: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>Лицензия</Label>
                <Input
                  value={editForm.licenseNumber}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      licenseNumber: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>О себе</Label>
                <Textarea
                  rows={4}
                  value={editForm.bio}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      bio: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-[12px]"
              onClick={() => setEditDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              className="rounded-[12px]"
              disabled={savingProfile}
              onClick={() => {
                void handleSaveProfile();
              }}
            >
              {savingProfile ? "Сохраняем..." : "Сохранить изменения"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
