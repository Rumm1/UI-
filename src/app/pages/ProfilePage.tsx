import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  BadgeCheck,
  Building2,
  Camera,
  Clock3,
  KeyRound,
  LogOut,
  Mail,
  PencilLine,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useAppData } from "../contexts/AppDataContext";
import { formatDisplayDateTime, getInitials } from "../lib/prototype";
import {
  ProfileAvatar,
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

const maxAvatarFileSize = 8 * 1024 * 1024;
const maxAvatarDimension = 512;

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Не удалось прочитать изображение."));
    };
    reader.onerror = () => {
      reject(new Error("Не удалось прочитать изображение."));
    };
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Не удалось загрузить изображение."));
    image.src = source;
  });
}

async function prepareAvatarImage(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Выберите файл изображения.");
  }

  if (file.size > maxAvatarFileSize) {
    throw new Error("Файл слишком большой. Используйте изображение до 8 МБ.");
  }

  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const scale = Math.min(
    1,
    maxAvatarDimension / image.width,
    maxAvatarDimension / image.height,
  );
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Не удалось подготовить изображение.");
  }

  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.86);
}

function buildIdentity(profile: ProfileSettings) {
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();

  return {
    fullName,
    initials: getInitials(fullName) || profile.initials || "ИИ",
  };
}

export function ProfilePage() {
  const navigate = useNavigate();
  const {
    bootstrapError,
    isBootstrapping,
    profile,
    retryBootstrap,
    saveProfile,
  } = useAppData();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [securityDialogOpen, setSecurityDialogOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProfileSettings>(profile);
  const [avatarDraft, setAvatarDraft] = useState<ProfileAvatarPreset>(
    profile.avatarPreset,
  );
  const [avatarDraftImage, setAvatarDraftImage] = useState<string | null>(
    profile.avatarImage,
  );
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setEditForm(profile);
    setAvatarDraft(profile.avatarPreset);
    setAvatarDraftImage(profile.avatarImage);
  }, [profile]);

  useEffect(() => {
    if (!securityDialogOpen) {
      setPasswordForm(emptyPasswordForm);
      setPasswordError(null);
    }
  }, [securityDialogOpen]);

  useEffect(() => {
    if (!avatarDialogOpen) {
      setAvatarDraft(profile.avatarPreset);
      setAvatarDraftImage(profile.avatarImage);
      setAvatarError(null);
    }
  }, [avatarDialogOpen, profile.avatarImage, profile.avatarPreset]);

  const passwordUpdatedLabel = profile.passwordUpdatedAt
    ? formatDisplayDateTime(profile.passwordUpdatedAt)
    : "Не обновлялся";

  const infoCards = [
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

  async function handleSaveAvatar() {
    if (
      avatarDraft === profile.avatarPreset &&
      avatarDraftImage === profile.avatarImage
    ) {
      setAvatarDialogOpen(false);
      return;
    }

    setSavingAvatar(true);

    try {
      await saveProfile({
        ...profile,
        avatarPreset: avatarDraft,
        avatarImage: avatarDraftImage,
      });
      setAvatarDialogOpen(false);
    } finally {
      setSavingAvatar(false);
    }
  }

  async function handleAvatarFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setAvatarError(null);

    try {
      const nextAvatarImage = await prepareAvatarImage(file);
      setAvatarDraftImage(nextAvatarImage);
    } catch (error) {
      setAvatarError(
        error instanceof Error
          ? error.message
          : "Не удалось обновить фотографию профиля.",
      );
    }
  }

  function handleRemoveAvatarPhoto() {
    setAvatarDraftImage(null);
    setAvatarError(null);
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

  function handleLogout() {
    toast.success("Вы вышли из аккаунта", {
      description: "В демо-режиме можно в любой момент снова открыть профиль.",
    });
    navigate("/", { replace: true });
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
        <div className="mx-auto max-w-6xl p-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-44 rounded-xl" />
            <Skeleton className="h-4 w-72 rounded-xl" />
          </div>
          <div className="mt-6 rounded-3xl border border-border bg-card p-6">
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              <Skeleton className="h-[520px] rounded-2xl" />
              <Skeleton className="h-[520px] rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-semibold text-foreground">Профиль</h1>
          <p className="text-sm text-muted-foreground">
            Личный кабинет врача, данные аккаунта и параметры безопасности.
          </p>
        </div>

        <section className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="grid lg:grid-cols-[320px_1fr]">
            <aside className="border-b border-border p-6 lg:border-b-0 lg:border-r">
              <div className="rounded-[20px] border border-border bg-muted/35 p-5">
                <ProfileAvatar
                  avatarPreset={profile.avatarPreset}
                  avatarImage={profile.avatarImage}
                  fullName={profile.fullName}
                  className="mx-auto size-28"
                  iconClassName="size-12"
                />

                <div className="mt-5 text-center">
                  <h2 className="text-xl font-semibold text-foreground">
                    {profile.fullName}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {profile.specialty}
                  </p>
                  <p className="text-xs text-muted-foreground">{profile.role}</p>
                </div>

                <Button
                  variant="outline"
                  className="mt-5 w-full rounded-[12px]"
                  onClick={() => setAvatarDialogOpen(true)}
                >
                  <Camera className="size-4" />
                  Сменить фото
                </Button>
              </div>

              <div className="mt-4 rounded-[18px] border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
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
                  className="mt-4 w-full rounded-[12px]"
                  onClick={() => setSecurityDialogOpen(true)}
                >
                  <KeyRound className="size-4" />
                  Сменить пароль
                </Button>
              </div>
            </aside>

            <section className="p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {infoCards.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-[16px] border border-border bg-background/60 p-4"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
                          <Icon className="size-4" />
                        </div>
                        <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                          {item.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{item.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-[16px] border border-border bg-background/60 p-5">
                <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  О профиле
                </p>
                <p className="text-sm leading-7 text-foreground">{profile.bio}</p>
              </div>

              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <Button
                  variant="outline"
                  className="rounded-[12px] text-destructive hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="size-4" />
                  Выйти из аккаунта
                </Button>

                <Button
                  className="rounded-[12px]"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <PencilLine className="size-4" />
                  Редактировать профиль
                </Button>
              </div>
            </section>
          </div>
        </section>
      </div>

      <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle>Фото профиля</DialogTitle>
            <DialogDescription>
              Загрузите фотографию для профиля или оставьте одну из системных иконок.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-[20px] border border-border bg-muted/35 p-5">
            <div className="flex flex-col items-center gap-4 text-center">
              <ProfileAvatar
                avatarPreset={avatarDraft}
                avatarImage={avatarDraftImage}
                fullName={profile.fullName}
                className="size-24"
                iconClassName="size-10"
              />

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {avatarDraftImage
                    ? "Фотография будет показана в профиле и в верхнем меню."
                    : "Пока используется системная иконка профиля."}
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Фото имеет приоритет. Если удалить его, снова будет показана выбранная иконка.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    void handleAvatarFileChange(event);
                  }}
                />
                <Button
                  variant="outline"
                  className="rounded-[12px]"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Camera className="size-4" />
                  Загрузить фото
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-[12px]"
                  disabled={!avatarDraftImage}
                  onClick={handleRemoveAvatarPhoto}
                >
                  Удалить фото
                </Button>
              </div>
            </div>
          </div>

          {avatarError ? (
            <div className="rounded-[12px] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {avatarError}
            </div>
          ) : null}

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Резервная иконка</p>
                <p className="text-xs text-muted-foreground">
                  Она будет показана, если фотография не выбрана.
                </p>
              </div>
            </div>

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
              {savingAvatar ? "Сохраняем..." : "Сохранить"}
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
