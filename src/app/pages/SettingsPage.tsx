import { useEffect, useMemo, useState } from "react";
import { Bell, Globe, RotateCcw, Save, Settings2, UserRound } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

export function SettingsPage() {
  const navigate = useNavigate();
  const { bootstrapError, isBootstrapping, profile, resetDemoData, retryBootstrap, saveProfile } = useAppData();
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
    return <main className="flex-1 overflow-auto p-6"><StatePanel variant="error" title="Не удалось загрузить настройки" description={bootstrapError} actionLabel="Повторить" onAction={() => { void retryBootstrap(); }} /></main>;
  }

  if (isBootstrapping) {
    return <main className="flex-1 overflow-auto"><div className="mx-auto max-w-[1440px] p-6"><div className="space-y-2"><Skeleton className="h-8 w-52 rounded-xl" /><Skeleton className="h-4 w-72 rounded-xl" /></div><div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.3fr]"><Skeleton className="h-[720px] rounded-3xl" /><Skeleton className="h-[720px] rounded-3xl" /></div></div></main>;
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1440px] p-6">
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-semibold text-foreground">Настройки</h1>
          <p className="text-sm text-muted-foreground">Editable form state, dirty-check, уведомления, рабочее время и mock theme/language.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center gap-4 border-b border-border pb-6">
              <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">{form.initials}</div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{form.fullName}</h2>
                <p className="text-sm text-muted-foreground">{form.specialty}</p>
              </div>
            </div>

            <div className="space-y-4">
              <button onClick={() => navigate("/notifications")} className="flex w-full items-center gap-3 rounded-2xl border border-border p-4 text-left transition-colors hover:bg-accent/40"><Bell className="size-5 text-primary" /><div><p className="text-sm font-medium text-foreground">Лента уведомлений</p><p className="text-xs text-muted-foreground">Открыть системные уведомления</p></div></button>
              <div className="rounded-2xl border border-border p-4"><div className="mb-3 flex items-center gap-3"><Globe className="size-5 text-primary" /><div><p className="text-sm font-medium text-foreground">Локализация</p><p className="text-xs text-muted-foreground">Mock-переключение темы и языка применяется ко всему прототипу.</p></div></div><div className="space-y-3"><div><Label>Язык</Label><Select value={form.language} onValueChange={(value: "ru" | "en") => setForm((c) => ({ ...c, language: value }))}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ru">Русский</SelectItem><SelectItem value="en">English</SelectItem></SelectContent></Select></div><div><Label>Тема</Label><Select value={form.theme} onValueChange={(value: "light" | "dark" | "system") => setForm((c) => ({ ...c, theme: value }))}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem><SelectItem value="system">System</SelectItem></SelectContent></Select></div></div></div>
              <div className="rounded-2xl border border-border p-4"><div className="mb-3 flex items-center gap-3"><Settings2 className="size-5 text-primary" /><div><p className="text-sm font-medium text-foreground">Состояние формы</p><p className="text-xs text-muted-foreground">{isDirty ? "Есть несохраненные изменения" : "Изменений нет"}</p></div></div><div className={`rounded-2xl px-3 py-2 text-sm ${isDirty ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{isDirty ? "Кнопка сохранения активна, потому что данные изменены." : "Кнопка сохранения отключена, пока форма совпадает с сохраненным профилем."}</div></div>
              <div className="rounded-2xl border border-border p-4"><div className="mb-3 flex items-center gap-3"><RotateCcw className="size-5 text-primary" /><div><p className="text-sm font-medium text-foreground">Сброс демо-данных</p><p className="text-xs text-muted-foreground">Возвращает пациентов, приемы, записи, назначения и уведомления к начальному сценарию.</p></div></div><AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="w-full rounded-2xl" disabled={resetting}><RotateCcw className="mr-2 size-4" />{resetting ? "Сбрасываем..." : "Сбросить демо-режим"}</Button></AlertDialogTrigger><AlertDialogContent className="rounded-3xl"><AlertDialogHeader><AlertDialogTitle>Сбросить демо-данные?</AlertDialogTitle><AlertDialogDescription>Все изменения в mock-слое будут удалены. Это удобно перед новой презентацией руководителю.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-2xl">Отмена</AlertDialogCancel><AlertDialogAction className="rounded-2xl" onClick={() => { void handleResetDemo(); }}>Сбросить данные</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-6 flex items-center gap-3"><UserRound className="size-5 text-primary" /><div><h2 className="text-lg font-semibold text-foreground">Профиль врача</h2><p className="text-sm text-muted-foreground">Изменения сохраняются в mock-store после нажатия кнопки сохранения.</p></div></div>

            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Имя</Label><Input value={form.firstName} onChange={(e) => setForm((c) => ({ ...c, firstName: e.target.value, fullName: `${e.target.value} ${c.lastName}`.trim(), initials: `${e.target.value[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase() }))} /></div>
              <div><Label>Фамилия</Label><Input value={form.lastName} onChange={(e) => setForm((c) => ({ ...c, lastName: e.target.value, fullName: `${c.firstName} ${e.target.value}`.trim(), initials: `${c.firstName[0] ?? ""}${e.target.value[0] ?? ""}`.toUpperCase() }))} /></div>
              <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} /></div>
              <div><Label>Телефон</Label><Input value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} /></div>
              <div><Label>Специальность</Label><Input value={form.specialty} onChange={(e) => setForm((c) => ({ ...c, specialty: e.target.value }))} /></div>
              <div><Label>Клиника</Label><Input value={form.clinic} onChange={(e) => setForm((c) => ({ ...c, clinic: e.target.value }))} /></div>
              <div><Label>Часовой пояс</Label><Input value={form.timezone} onChange={(e) => setForm((c) => ({ ...c, timezone: e.target.value }))} /></div>
              <div><Label>Роль</Label><Input value={form.role} onChange={(e) => setForm((c) => ({ ...c, role: e.target.value }))} /></div>
              <div className="md:col-span-2"><Label>Лицензия</Label><Input value={form.licenseNumber} onChange={(e) => setForm((c) => ({ ...c, licenseNumber: e.target.value }))} /></div>
              <div className="md:col-span-2"><Label>О себе</Label><Textarea rows={4} value={form.bio} onChange={(e) => setForm((c) => ({ ...c, bio: e.target.value }))} /></div>
            </div>

            <div className="my-6 border-t border-border pt-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Уведомления</h3>
              <div className="space-y-3">
                {[
                  { key: "push", label: "Push-уведомления", hint: "Показывать моментальные уведомления в интерфейсе" },
                  { key: "email", label: "Email-уведомления", hint: "Дублировать важные события на email" },
                  { key: "sms", label: "SMS-уведомления", hint: "Получать смс по срочным событиям" },
                  { key: "criticalOnly", label: "Только критичные", hint: "Оставить только high/critical события" },
                  { key: "dailyDigest", label: "Ежедневный дайджест", hint: "Сводка по активности за день" },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-2xl border border-border p-4">
                    <div><p className="text-sm font-medium text-foreground">{item.label}</p><p className="text-xs text-muted-foreground">{item.hint}</p></div>
                    <Switch checked={form.notifications[item.key as keyof ProfileSettings["notifications"]]} onCheckedChange={(checked) => setForm((c) => ({ ...c, notifications: { ...c.notifications, [item.key]: checked } }))} />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">Рабочий график</h3>
              <div className="space-y-3">
                {form.workingHours.map((day) => (
                  <div key={day.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3"><Switch checked={day.enabled} onCheckedChange={(checked) => setForm((c) => ({ ...c, workingHours: c.workingHours.map((item) => item.id === day.id ? { ...item, enabled: checked } : item) }))} /><div><p className="text-sm font-medium text-foreground">{day.label}</p><p className="text-xs text-muted-foreground">{day.enabled ? "Рабочий день" : "Выходной"}</p></div></div>
                    <div className="flex items-center gap-2"><Input type="time" value={day.start} disabled={!day.enabled} onChange={(e) => setForm((c) => ({ ...c, workingHours: c.workingHours.map((item) => item.id === day.id ? { ...item, start: e.target.value } : item) }))} className="w-[132px]" /><span className="text-muted-foreground">—</span><Input type="time" value={day.end} disabled={!day.enabled} onChange={(e) => setForm((c) => ({ ...c, workingHours: c.workingHours.map((item) => item.id === day.id ? { ...item, end: e.target.value } : item) }))} className="w-[132px]" /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" className="rounded-2xl" disabled={!isDirty} onClick={() => setForm(profile)}>Сбросить</Button>
              <Button className="rounded-2xl" disabled={!isDirty || saving} onClick={() => void handleSave()}><Save className="mr-2 size-4" />{saving ? "Сохраняем..." : "Сохранить настройки"}</Button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
