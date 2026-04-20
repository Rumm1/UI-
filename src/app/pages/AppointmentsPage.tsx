import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  UserRound,
} from "lucide-react";
import {
  addDays,
  format,
  isSameDay,
  parse,
  setHours,
  setMinutes,
  startOfWeek,
} from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate, useSearchParams } from "react-router";
import { useAppData } from "../contexts/AppDataContext";
import {
  Appointment,
  AppointmentStatus,
  NewAppointmentInput,
  Patient,
} from "../types/medical";
import {
  appointmentStatusLabels,
  formatDisplayDateTime,
  getPatientById,
} from "../lib/prototype";
import { StatusBadge } from "../components/shared/StatusBadge";
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
} from "../components/ui/alert-dialog";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

type ViewMode = "day" | "week";

const timeSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];

function toDateInput(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function mergeDateTime(dateValue: string, timeValue: string) {
  const parsedDate = parse(dateValue, "yyyy-MM-dd", new Date());
  const [hours, minutes] = timeValue.split(":").map(Number);
  return setMinutes(setHours(parsedDate, hours), minutes).toISOString();
}

function buildAppointmentFormState(
  initialDate: Date,
  initialPatientId?: string | null,
  patients: Patient[] = [],
  initialTime = "10:00",
) {
  return {
    patientId: initialPatientId ?? patients[0]?.id ?? "",
    doctorName: "Иванов И.И.",
    department: "Терапия",
    room: "101",
    type: "Консультация",
    date: toDateInput(initialDate),
    time: initialTime,
    durationMinutes: "30",
    status: "pending" as AppointmentStatus,
    notes: "",
  };
}

function isAppointmentStatus(value: string | null): value is AppointmentStatus {
  return value === "confirmed" || value === "pending" || value === "cancelled" || value === "completed";
}

function AppointmentDialog({
  open,
  patients,
  onOpenChange,
  onSubmit,
  initialDate,
  initialPatientId,
  initialTime,
}: {
  open: boolean;
  patients: Patient[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: NewAppointmentInput) => Promise<void>;
  initialDate: Date;
  initialPatientId?: string | null;
  initialTime?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() =>
    buildAppointmentFormState(initialDate, initialPatientId, patients, initialTime),
  );
  const isValidForm =
    form.patientId.trim().length > 0 &&
    form.doctorName.trim().length > 0 &&
    form.department.trim().length > 0 &&
    form.type.trim().length > 0 &&
    form.room.trim().length > 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(buildAppointmentFormState(initialDate, initialPatientId, patients, initialTime));
  }, [initialDate, initialPatientId, initialTime, patients, open]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit({
        patientId: form.patientId,
        doctorName: form.doctorName,
        department: form.department,
        room: form.room,
        type: form.type,
        startAt: mergeDateTime(form.date, form.time),
        durationMinutes: Number(form.durationMinutes),
        status: form.status,
        notes: form.notes,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader><DialogTitle>Новая запись на прием</DialogTitle></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><Label>Пациент</Label><Select value={form.patientId} onValueChange={(value) => setForm((c) => ({ ...c, patientId: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{patients.map((patient) => <SelectItem key={patient.id} value={patient.id}>{patient.fullName}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Врач</Label><Input value={form.doctorName} onChange={(e) => setForm((c) => ({ ...c, doctorName: e.target.value }))} /></div>
          <div><Label>Отделение</Label><Input value={form.department} onChange={(e) => setForm((c) => ({ ...c, department: e.target.value }))} /></div>
          <div><Label>Дата</Label><Input type="date" value={form.date} onChange={(e) => setForm((c) => ({ ...c, date: e.target.value }))} /></div>
          <div><Label>Время</Label><Input type="time" value={form.time} onChange={(e) => setForm((c) => ({ ...c, time: e.target.value }))} /></div>
          <div><Label>Тип приема</Label><Input value={form.type} onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))} /></div>
          <div><Label>Кабинет</Label><Input value={form.room} onChange={(e) => setForm((c) => ({ ...c, room: e.target.value }))} /></div>
          <div><Label>Длительность</Label><Select value={form.durationMinutes} onValueChange={(value) => setForm((c) => ({ ...c, durationMinutes: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="30">30 минут</SelectItem><SelectItem value="60">60 минут</SelectItem></SelectContent></Select></div>
          <div><Label>Статус</Label><Select value={form.status} onValueChange={(value: AppointmentStatus) => setForm((c) => ({ ...c, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">Ожидает</SelectItem><SelectItem value="confirmed">Подтверждена</SelectItem><SelectItem value="cancelled">Отменена</SelectItem><SelectItem value="completed">Завершена</SelectItem></SelectContent></Select></div>
          <div className="md:col-span-2"><Label>Комментарий</Label><Textarea rows={4} value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button><Button disabled={submitting || !isValidForm} onClick={() => void handleSubmit()}>{submitting ? "Сохраняем..." : "Создать запись"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AppointmentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addAppointment, appointments, bootstrapError, isBootstrapping, patients, retryBootstrap, setAppointmentStatus } = useAppData();
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState(new Date());
  const [createTime, setCreateTime] = useState("10:00");
  const [createPatientId, setCreatePatientId] = useState<string | null>(searchParams.get("patient"));
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusToConfirm, setStatusToConfirm] = useState<AppointmentStatus | null>(null);
  const appointmentId = searchParams.get("appointment");
  const statusFilter = isAppointmentStatus(searchParams.get("status"))
    ? searchParams.get("status")
    : "all";

  const selectedPatientFromContext = getPatientById(
    patients,
    createPatientId ?? searchParams.get("patient") ?? "",
  );

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCreateOpen(true);
      setCreatePatientId(searchParams.get("patient"));
      setCreateTime("10:00");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!appointmentId) {
      return;
    }

    const appointment = appointments.find((item) => item.id === appointmentId);

    if (!appointment) {
      return;
    }

    setCurrentDate(new Date(appointment.startAt));
    setViewMode("day");
  }, [appointmentId, appointments]);

  const weekDates = Array.from({ length: 7 }, (_, index) =>
    addDays(startOfWeek(currentDate, { weekStartsOn: 1 }), index),
  );
  const periodDates = viewMode === "day" ? [currentDate] : weekDates;

  const periodAppointments = appointments
    .filter((appointment) =>
      periodDates.some((date) => isSameDay(new Date(appointment.startAt), date)),
    )
    .filter((appointment) => statusFilter === "all" || appointment.status === statusFilter);

  const dayAppointments = appointments
    .filter((appointment) => isSameDay(new Date(appointment.startAt), currentDate))
    .filter((appointment) => statusFilter === "all" || appointment.status === statusFilter)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const selectedAppointment =
    dayAppointments.find((appointment) => appointment.id === appointmentId) ??
    dayAppointments[0] ??
    null;

  const totalSlots = periodDates.length * timeSlots.length;
  const freeSlots = Math.max(totalSlots - periodAppointments.length, 0);
  const confirmedCount = periodAppointments.filter((item) => item.status === "confirmed").length;
  const pendingCount = periodAppointments.filter((item) => item.status === "pending").length;

  function focusDate(date: Date, nextViewMode: ViewMode = "day") {
    const next = new URLSearchParams(searchParams);
    next.delete("appointment");
    setCurrentDate(date);
    setViewMode(nextViewMode);
    setSearchParams(next);
  }

  const summaryCards = [
    {
      label: "Всего приемов",
      value: periodAppointments.length,
      tone: "bg-primary/10 text-primary",
      onClick: () => {
        const next = new URLSearchParams(searchParams);
        next.delete("status");
        setSearchParams(next);
      },
    },
    {
      label: "Подтверждено",
      value: confirmedCount,
      tone: "bg-emerald-100 text-emerald-700",
      onClick: () => {
        const next = new URLSearchParams(searchParams);
        next.set("status", "confirmed");
        setSearchParams(next);
      },
    },
    {
      label: "Ожидают",
      value: pendingCount,
      tone: "bg-amber-100 text-amber-700",
      onClick: () => {
        const next = new URLSearchParams(searchParams);
        next.set("status", "pending");
        setSearchParams(next);
      },
    },
    {
      label: "Свободно слотов",
      value: freeSlots,
      tone: "bg-sky-100 text-sky-700",
      onClick: () => {
        setCreateDate(currentDate);
        setCreateTime("10:00");
        setCreateOpen(true);
      },
    },
  ];

  async function handleCreate(payload: NewAppointmentInput) {
    const appointment = await addAppointment(payload);
    const next = new URLSearchParams(searchParams);
    next.delete("new");
    next.set("appointment", appointment.id);
    next.set("patient", appointment.patientId);
    next.delete("status");
    setViewMode("day");
    setCurrentDate(new Date(appointment.startAt));
    setSearchParams(next);
  }

  async function applyStatusChange(status: AppointmentStatus) {
    if (!selectedAppointment) return;

    setStatusUpdateLoading(true);
    try {
      await setAppointmentStatus(selectedAppointment.id, status);
    } finally {
      setStatusUpdateLoading(false);
    }
  }

  async function handleStatusChange(status: AppointmentStatus) {
    if (!selectedAppointment) return;

    if (status === "cancelled" && selectedAppointment.status !== "cancelled") {
      setStatusToConfirm(status);
      return;
    }

    await applyStatusChange(status);
  }

  function moveRange(direction: "prev" | "next") {
    const delta = viewMode === "day" ? 1 : 7;
    setCurrentDate((current) => addDays(current, direction === "next" ? delta : -delta));
  }

  if (bootstrapError) {
    return <main className="flex-1 overflow-auto p-6"><StatePanel variant="error" title="Не удалось загрузить расписание" description={bootstrapError} actionLabel="Повторить" onAction={() => { void retryBootstrap(); }} /></main>;
  }

  if (isBootstrapping) {
    return <main className="flex-1 overflow-auto"><div className="mx-auto max-w-[1440px] p-6"><div className="mb-6 flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-8 w-64 rounded-xl" /><Skeleton className="h-4 w-80 rounded-xl" /></div><Skeleton className="h-11 w-40 rounded-2xl" /></div><Skeleton className="h-[720px] rounded-3xl" /></div></main>;
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1440px] p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><h1 className="mb-1 text-2xl font-semibold text-foreground">Расписание приемов</h1><p className="text-sm text-muted-foreground">День/неделя, создание новой записи, свободные слоты и изменение статуса через UI.</p></div>
          <Button className="rounded-2xl" onClick={() => { setCreateDate(currentDate); setCreateTime("10:00"); setCreatePatientId(searchParams.get("patient")); setCreateOpen(true); }}><Plus className="mr-2 size-4" />Новая запись</Button>
        </div>

        {selectedPatientFromContext ? (
          <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Контекст пациента: {selectedPatientFromContext.fullName}</p>
              <p className="text-sm text-muted-foreground">Новая запись будет предзаполнена этим пациентом. Можно сразу перейти в профиль или создать медкарту после приема.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => navigate(`/patients?patient=${selectedPatientFromContext.id}`)}>Профиль пациента</Button>
              <Button variant="outline" className="rounded-2xl" onClick={() => { const next = new URLSearchParams(searchParams); next.delete("patient"); setCreatePatientId(null); setSearchParams(next); }}>Очистить контекст</Button>
            </div>
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => <button key={item.label} onClick={item.onClick} className="rounded-3xl border border-border bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg"><div className={`mb-3 flex size-12 items-center justify-center rounded-2xl ${item.tone}`}><CalendarDays className="size-5" /></div><p className="text-sm text-muted-foreground">{item.label}</p><p className="text-3xl font-semibold text-foreground">{item.value}</p></button>)}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-2xl" onClick={() => moveRange("prev")}><ChevronLeft className="size-4" /></Button>
                <div className="min-w-[220px] rounded-2xl bg-muted px-4 py-2 text-center text-sm font-medium text-foreground">
                  {viewMode === "day"
                    ? format(currentDate, "dd MMMM yyyy", { locale: ru })
                    : `${format(weekDates[0], "dd MMM", { locale: ru })} - ${format(weekDates[weekDates.length - 1], "dd MMM", { locale: ru })}`}
                </div>
                <Button variant="outline" className="rounded-2xl" onClick={() => moveRange("next")}><ChevronRight className="size-4" /></Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-[10px] bg-muted p-1">
                  <button onClick={() => setViewMode("day")} className={`rounded-[10px] border px-4 py-2 text-sm transition-all duration-200 ease-out ${viewMode === "day" ? "border-sky-300/55 bg-sky-500/10 text-sky-900 shadow-[0_10px_24px_-18px_rgba(14,165,233,0.85)] dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-50" : "border-transparent text-muted-foreground hover:border-sky-300/35 hover:bg-sky-500/[0.05] hover:text-foreground dark:hover:border-sky-400/20 dark:hover:bg-sky-400/[0.08]"}`}>День</button>
                  <button onClick={() => setViewMode("week")} className={`rounded-[10px] border px-4 py-2 text-sm transition-all duration-200 ease-out ${viewMode === "week" ? "border-sky-300/55 bg-sky-500/10 text-sky-900 shadow-[0_10px_24px_-18px_rgba(14,165,233,0.85)] dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-50" : "border-transparent text-muted-foreground hover:border-sky-300/35 hover:bg-sky-500/[0.05] hover:text-foreground dark:hover:border-sky-400/20 dark:hover:bg-sky-400/[0.08]"}`}>Неделя</button>
                </div>
                <Button
                  variant="outline"
                  className={`rounded-[10px] transition-all duration-200 ease-out ${isSameDay(currentDate, new Date()) ? "border-sky-300/55 bg-sky-500/10 text-sky-900 hover:bg-sky-500/10 hover:text-sky-900 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-50 dark:hover:bg-sky-400/10 dark:hover:text-sky-50" : "border-border"}`}
                  onClick={() => focusDate(new Date(), "day")}
                >
                  Сегодня
                </Button>
              </div>
            </div>

            <div className="mb-5 overflow-x-auto pb-2">
              <div className="flex min-w-max gap-3">
                {weekDates.map((date) => {
                  const dailyCount = appointments.filter((appointment) =>
                    isSameDay(new Date(appointment.startAt), date) &&
                    (statusFilter === "all" || appointment.status === statusFilter),
                  ).length;
                  const isActiveDate = isSameDay(date, currentDate);
                  const isTodayDate = isSameDay(date, new Date());

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => focusDate(date, "day")}
                      className={`min-w-[108px] rounded-[10px] border px-4 py-3 text-left transition-all duration-200 ease-out ${
                        isActiveDate
                          ? "border-sky-300/55 bg-sky-500/10 shadow-[0_10px_24px_-18px_rgba(14,165,233,0.85)] dark:border-sky-400/25 dark:bg-sky-400/10"
                          : "border-border hover:border-sky-300/35 hover:bg-sky-500/[0.05] dark:hover:border-sky-400/20 dark:hover:bg-sky-400/[0.08]"
                      }`}
                    >
                      <p className={`text-[11px] uppercase tracking-[0.18em] ${isTodayDate ? "text-sky-700 dark:text-sky-300" : "text-muted-foreground"}`}>
                        {format(date, "EE", { locale: ru })}
                      </p>
                      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                        {format(date, "dd", { locale: ru })}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {dailyCount > 0 ? `${dailyCount} запис.` : "Нет записей"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              <Button
                variant="outline"
                className={`rounded-[10px] transition-all duration-200 ease-out ${statusFilter === "all" ? "border-sky-300/55 bg-sky-500/10 text-sky-900 hover:bg-sky-500/10 hover:text-sky-900 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-50 dark:hover:bg-sky-400/10 dark:hover:text-sky-50" : "border-border"}`}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete("status");
                  setSearchParams(next);
                }}
              >
                Все статусы
              </Button>
              {(["pending", "confirmed", "completed", "cancelled"] as AppointmentStatus[]).map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  className={`rounded-[10px] transition-all duration-200 ease-out ${statusFilter === status ? "border-sky-300/55 bg-sky-500/10 text-sky-900 hover:bg-sky-500/10 hover:text-sky-900 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-50 dark:hover:bg-sky-400/10 dark:hover:text-sky-50" : "border-border"}`}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.set("status", status);
                    setSearchParams(next);
                  }}
                >
                  {appointmentStatusLabels[status]}
                </Button>
              ))}
            </div>

            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Записи на {format(currentDate, "dd MMMM", { locale: ru })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dayAppointments.length > 0 ? `${dayAppointments.length} приемов в выбранный день` : "В выбранный день пока нет записей"}
                </p>
              </div>
            </div>

            <div className="grid gap-2 grid-cols-[88px_1fr]">
              <div />
              <div className={`rounded-[10px] border px-4 py-3 text-center ${isSameDay(currentDate, new Date()) ? "border-sky-300/55 bg-sky-500/10 text-sky-900 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-50" : "border-transparent bg-muted text-foreground"}`}>
                <p className="text-xs uppercase tracking-[0.18em]">{format(currentDate, "EEEE", { locale: ru })}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{format(currentDate, "dd", { locale: ru })}</p>
              </div>
              {timeSlots.map((slot) => (
                <div key={slot} className="contents">
                  <div key={`${slot}-label`} className="pt-5 text-sm text-muted-foreground">{slot}</div>
                  {(() => {
                    const appointment = dayAppointments.find(
                      (item) => format(new Date(item.startAt), "HH:mm") === slot,
                    );
                    const isSelectedAppointment = appointment?.id === selectedAppointment?.id;

                    return (
                      <button
                        key={`${currentDate.toISOString()}-${slot}`}
                        onClick={() => {
                          if (appointment) {
                            const next = new URLSearchParams(searchParams);
                            next.set("appointment", appointment.id);
                            next.set("patient", appointment.patientId);
                            setSearchParams(next);
                          } else {
                            setCreateDate(currentDate);
                            setCreateTime(slot);
                            setCreatePatientId(searchParams.get("patient"));
                            setCreateOpen(true);
                          }
                        }}
                        className={`min-h-[72px] rounded-[10px] border p-3 text-left transition-all duration-200 ease-out ${appointment ? isSelectedAppointment ? "border-sky-300/55 bg-sky-500/10 shadow-[0_10px_24px_-18px_rgba(14,165,233,0.85)] dark:border-sky-400/25 dark:bg-sky-400/10" : "border-sky-200/45 bg-sky-500/[0.05] hover:bg-sky-500/[0.08] dark:border-sky-400/18 dark:bg-sky-400/[0.06] dark:hover:bg-sky-400/[0.1]" : "border-border hover:border-sky-300/35 hover:bg-sky-500/[0.04] dark:hover:border-sky-400/20 dark:hover:bg-sky-400/[0.08]"}`}
                      >
                        {appointment ? (
                          <>
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <p className="truncate text-sm font-medium text-foreground">{getPatientById(patients, appointment.patientId)?.fullName}</p>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">{appointment.type}</p>
                            <div className="mt-2"><StatusBadge label={appointmentStatusLabels[appointment.status]} status={appointment.status} /></div>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Свободный слот</span>
                        )}
                      </button>
                    );
                  })()}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            {selectedAppointment ? (
              (() => {
                const patient = getPatientById(patients, selectedAppointment.patientId);
                return (
                  <>
                    <div className="mb-6 border-b border-border pb-6">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="size-6" /></div>
                        <div><h2 className="text-lg font-semibold text-foreground">{patient?.fullName}</h2><p className="text-sm text-muted-foreground">{selectedAppointment.department} • кабинет {selectedAppointment.room}</p></div>
                      </div>
                      <StatusBadge label={appointmentStatusLabels[selectedAppointment.status]} status={selectedAppointment.status} />
                    </div>
                    <div className="space-y-4">
                      <div><p className="text-xs text-muted-foreground">Дата и время</p><p className="text-sm font-medium text-foreground">{formatDisplayDateTime(selectedAppointment.startAt)}</p></div>
                      <div><p className="text-xs text-muted-foreground">Длительность</p><p className="text-sm font-medium text-foreground">{selectedAppointment.durationMinutes} минут</p></div>
                      <div><p className="text-xs text-muted-foreground">Тип приема</p><p className="text-sm font-medium text-foreground">{selectedAppointment.type}</p></div>
                      <div><p className="text-xs text-muted-foreground">Комментарий</p><p className="text-sm text-foreground">{selectedAppointment.notes || "Комментарий не указан"}</p></div>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-2">
                      {(["confirmed", "pending", "completed", "cancelled"] as AppointmentStatus[]).map((status) => (
                        <Button key={status} variant="outline" className={`rounded-[10px] transition-all duration-200 ease-out ${selectedAppointment.status === status ? "border-sky-300/55 bg-sky-500/10 text-sky-900 hover:bg-sky-500/10 hover:text-sky-900 dark:border-sky-400/25 dark:bg-sky-400/10 dark:text-sky-50 dark:hover:bg-sky-400/10 dark:hover:text-sky-50" : "border-border"}`} disabled={statusUpdateLoading} onClick={() => { void handleStatusChange(status); }}>{appointmentStatusLabels[status]}</Button>
                      ))}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button className="rounded-2xl" onClick={() => navigate(`/records?patient=${selectedAppointment.patientId}&appointment=${selectedAppointment.id}&new=1`)}><FileText className="mr-2 size-4" />Создать медзапись</Button>
                      <Button variant="outline" className="rounded-2xl" onClick={() => navigate(`/records?patient=${selectedAppointment.patientId}`)}>Открыть медкарту</Button>
                      <Button variant="outline" className="rounded-2xl" onClick={() => navigate(`/patients?patient=${selectedAppointment.patientId}`)}>Профиль пациента</Button>
                    </div>
                  </>
                );
              })()
            ) : (
              <StatePanel title="Выберите запись" description="Нажмите на прием в расписании или создайте новую запись из свободного слота." />
            )}
          </section>
        </div>

        <AppointmentDialog open={createOpen} patients={patients} initialDate={createDate} initialTime={createTime} initialPatientId={createPatientId} onOpenChange={(open) => { setCreateOpen(open); if (!open && searchParams.get("new")) { const next = new URLSearchParams(window.location.search); next.delete("new"); setSearchParams(next); } }} onSubmit={handleCreate} />
        <AlertDialog open={statusToConfirm === "cancelled"} onOpenChange={(open) => { if (!open) { setStatusToConfirm(null); } }}>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Отменить запись?</AlertDialogTitle>
              <AlertDialogDescription>
                Отмена сразу обновит расписание, detail panel и систему уведомлений. Используйте действие только для действительно отмененного приема.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-2xl">Вернуться</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-2xl"
                onClick={() => {
                  setStatusToConfirm(null);
                  void applyStatusChange("cancelled");
                }}
              >
                Подтвердить отмену
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
}
