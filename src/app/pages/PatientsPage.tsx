import { useEffect, useMemo, useState } from "react";
import {
  CalendarPlus,
  FileText,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  UserPen,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useAppData } from "../contexts/AppDataContext";
import { Appointment, NewPatientInput, Patient, PatientStatus, UpdatePatientInput } from "../types/medical";
import {
  appointmentStatusLabels,
  calculateAge,
  formatCompactDate,
  formatDisplayDateTime,
  formatDisplayTime,
  getPatientLastRecord,
  getPatientNextAppointment,
  patientStatusLabels,
  prescriptionStatusLabels,
  recordStatusLabels,
} from "../lib/prototype";
import { StatusBadge } from "../components/shared/StatusBadge";
import { StatePanel } from "../components/shared/StatePanel";
import { Skeleton } from "../components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

type SortValue = "recent" | "name" | "risk";

function buildPatientFormState(patient?: Patient) {
  return {
    fullName: patient?.fullName ?? "",
    gender: patient?.gender ?? ("female" as const),
    birthDate: patient?.birthDate ?? "1990-01-01",
    phone: patient?.phone ?? "",
    email: patient?.email ?? "",
    city: patient?.city ?? "Москва",
    address: patient?.address ?? "",
    diagnosis: patient?.diagnosis ?? "",
    status: patient?.status ?? ("active" as PatientStatus),
    overview: patient?.overview ?? "Новый пациент зарегистрирован в демонстрационном режиме.",
    lastDoctor: patient?.lastDoctor ?? "Иван Иванов",
    emergencyContact: patient?.emergencyContact ?? "Контакт будет добавлен позже",
    allergies: patient?.allergies.join(", ") ?? "",
    notes: patient?.notes ?? "",
    bloodPressure: patient?.metrics.bloodPressure ?? "120/80",
    pulse: String(patient?.metrics.pulse ?? 72),
    oxygenLevel: String(patient?.metrics.oxygenLevel ?? 98),
    temperature: String(patient?.metrics.temperature ?? 36.6),
  };
}

function PatientFormDialog({
  open,
  patient,
  mode,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  patient?: Patient;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: NewPatientInput | UpdatePatientInput) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() => buildPatientFormState(patient));
  const numericPulse = Number(form.pulse);
  const numericOxygenLevel = Number(form.oxygenLevel);
  const numericTemperature = Number(form.temperature);
  const isValidForm =
    form.fullName.trim().length > 2 &&
    form.phone.trim().length > 0 &&
    form.birthDate.trim().length > 0 &&
    form.bloodPressure.trim().length > 0 &&
    form.pulse.trim().length > 0 &&
    form.oxygenLevel.trim().length > 0 &&
    form.temperature.trim().length > 0 &&
    Number.isFinite(numericPulse) &&
    Number.isFinite(numericOxygenLevel) &&
    Number.isFinite(numericTemperature);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(buildPatientFormState(patient));
  }, [open, patient]);

  async function handleSubmit() {
    const allergies = form.allergies
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      await onSubmit({
        fullName: form.fullName.trim(),
        gender: form.gender,
        birthDate: form.birthDate,
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        diagnosis: form.diagnosis.trim(),
        status: form.status,
        notes: form.notes.trim(),
        overview: form.overview.trim(),
        lastDoctor: form.lastDoctor.trim(),
        emergencyContact: form.emergencyContact.trim(),
        allergies,
        metrics: {
          bloodPressure: form.bloodPressure.trim(),
          pulse: numericPulse,
          oxygenLevel: numericOxygenLevel,
          temperature: numericTemperature,
        },
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Добавить пациента" : "Редактировать пациента"}</DialogTitle>
          <DialogDescription>Все данные сохраняются в mock-store и сразу попадают в demo-прототип.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Основные данные</div>
          <div className="md:col-span-2"><Label>ФИО</Label><Input value={form.fullName} onChange={(e) => setForm((c) => ({ ...c, fullName: e.target.value }))} /></div>
          <div><Label>Пол</Label><Select value={form.gender} onValueChange={(value: "female" | "male") => setForm((c) => ({ ...c, gender: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="female">Женский</SelectItem><SelectItem value="male">Мужской</SelectItem></SelectContent></Select></div>
          <div><Label>Дата рождения</Label><Input type="date" value={form.birthDate} onChange={(e) => setForm((c) => ({ ...c, birthDate: e.target.value }))} /></div>
          <div><Label>Телефон</Label><Input value={form.phone} onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))} /></div>
          <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} /></div>
          <div><Label>Город</Label><Input value={form.city} onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))} /></div>
          <div><Label>Статус</Label><Select value={form.status} onValueChange={(value: PatientStatus) => setForm((c) => ({ ...c, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Активен</SelectItem><SelectItem value="follow-up">Нужен контроль</SelectItem><SelectItem value="inactive">Неактивен</SelectItem></SelectContent></Select></div>
          <div className="md:col-span-2"><Label>Адрес</Label><Input value={form.address} onChange={(e) => setForm((c) => ({ ...c, address: e.target.value }))} /></div>
          <div className="md:col-span-2"><Label>Диагноз</Label><Input value={form.diagnosis} onChange={(e) => setForm((c) => ({ ...c, diagnosis: e.target.value }))} /></div>
          <div className="md:col-span-2"><Label>Описание в карточке</Label><Textarea rows={3} value={form.overview} onChange={(e) => setForm((c) => ({ ...c, overview: e.target.value }))} /></div>
          <div><Label>Последний врач</Label><Input value={form.lastDoctor} onChange={(e) => setForm((c) => ({ ...c, lastDoctor: e.target.value }))} /></div>
          <div><Label>Контакт ЧС</Label><Input value={form.emergencyContact} onChange={(e) => setForm((c) => ({ ...c, emergencyContact: e.target.value }))} /></div>
          <div className="md:col-span-2"><Label>Аллергии</Label><Input value={form.allergies} placeholder="Например: Пенициллин, йод" onChange={(e) => setForm((c) => ({ ...c, allergies: e.target.value }))} /></div>
          <div className="md:col-span-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Показатели</div>
          <div><Label>АД</Label><Input value={form.bloodPressure} onChange={(e) => setForm((c) => ({ ...c, bloodPressure: e.target.value }))} /></div>
          <div><Label>Пульс</Label><Input type="number" min="0" value={form.pulse} onChange={(e) => setForm((c) => ({ ...c, pulse: e.target.value }))} /></div>
          <div><Label>SpO₂</Label><Input type="number" min="0" max="100" value={form.oxygenLevel} onChange={(e) => setForm((c) => ({ ...c, oxygenLevel: e.target.value }))} /></div>
          <div><Label>Температура</Label><Input type="number" step="0.1" value={form.temperature} onChange={(e) => setForm((c) => ({ ...c, temperature: e.target.value }))} /></div>
          <div className="md:col-span-2"><Label>Комментарий</Label><Textarea rows={4} value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting || !isValidForm}>{submitting ? "Сохраняем..." : mode === "create" ? "Добавить" : "Сохранить"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getRiskRank(patient: Patient) {
  return patient.riskLevel === "high" ? 3 : patient.riskLevel === "medium" ? 2 : 1;
}

export function PatientsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addPatient, appointments, bootstrapError, isBootstrapping, patients, prescriptions, records, retryBootstrap, savePatient } = useAppData();
  const [statusFilter, setStatusFilter] = useState<"all" | PatientStatus>("all");
  const [sortBy, setSortBy] = useState<SortValue>("recent");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const query = searchParams.get("query") ?? "";
  const selectedId = searchParams.get("patient");

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCreateOpen(true);
    }
  }, [searchParams]);

  const filteredPatients = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const next = patients
      .filter((patient) =>
        !needle ||
        [patient.fullName, patient.email, patient.phone, patient.diagnosis].join(" ").toLowerCase().includes(needle),
      )
      .filter((patient) => statusFilter === "all" || patient.status === statusFilter);
    next.sort((left, right) => {
      if (sortBy === "name") return left.fullName.localeCompare(right.fullName);
      if (sortBy === "risk") return getRiskRank(right) - getRiskRank(left);
      return new Date(right.lastVisitAt).getTime() - new Date(left.lastVisitAt).getTime();
    });
    return next;
  }, [patients, query, sortBy, statusFilter]);

  const selectedPatient = filteredPatients.find((patient) => patient.id === selectedId) ?? filteredPatients[0] ?? null;
  const patientAppointments = selectedPatient ? appointments.filter((item) => item.patientId === selectedPatient.id).sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()) : [];
  const patientRecords = selectedPatient ? records.filter((item) => item.patientId === selectedPatient.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
  const patientPrescriptions = selectedPatient ? prescriptions.filter((item) => item.patientId === selectedPatient.id) : [];
  const latestRecord = selectedPatient ? getPatientLastRecord(selectedPatient.id, records) : null;
  const nextAppointment = selectedPatient ? getPatientNextAppointment(selectedPatient.id, appointments) : null;

  useEffect(() => {
    if (selectedPatient && selectedPatient.id !== selectedId) {
      const next = new URLSearchParams(searchParams);
      next.set("patient", selectedPatient.id);
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, selectedId, selectedPatient, setSearchParams]);

  async function handleCreate(payload: NewPatientInput | UpdatePatientInput) {
    const patient = await addPatient(payload as NewPatientInput);
    setTab("overview");
    setSearchParams(
      new URLSearchParams({
        patient: patient.id,
      }),
    );
  }

  async function handleEdit(payload: NewPatientInput | UpdatePatientInput) {
    if (selectedPatient) {
      await savePatient(selectedPatient.id, payload);
      setTab("overview");
    }
  }

  if (bootstrapError) {
    return <main className="flex-1 overflow-auto p-6"><StatePanel variant="error" title="Не удалось загрузить пациентов" description={bootstrapError} actionLabel="Повторить" onAction={() => { void retryBootstrap(); }} /></main>;
  }

  if (isBootstrapping) {
    return <main className="flex-1 overflow-auto"><div className="mx-auto max-w-[1440px] p-6"><div className="mb-6 flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-8 w-60 rounded-xl" /><Skeleton className="h-4 w-72 rounded-xl" /></div><Skeleton className="h-11 w-44 rounded-2xl" /></div><div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"><Skeleton className="h-[720px] rounded-3xl" /><Skeleton className="h-[720px] rounded-3xl" /></div></div></main>;
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1440px] p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><h1 className="mb-1 text-2xl font-semibold text-foreground">Пациенты</h1><p className="text-sm text-muted-foreground">Рабочая база пациентов с поиском, фильтрацией, карточкой и переходами в связанные сценарии.</p></div>
          <Button className="rounded-2xl" onClick={() => setCreateOpen(true)}><Plus className="mr-2 size-4" />Добавить пациента</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => { const next = new URLSearchParams(searchParams); e.target.value ? next.set("query", e.target.value) : next.delete("query"); setSearchParams(next); }} placeholder="Поиск по имени, контакту или диагнозу" className="pl-10" /></div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex items-center gap-2 rounded-2xl border border-border px-3"><SlidersHorizontal className="size-4 text-muted-foreground" /><Select value={statusFilter} onValueChange={(value: "all" | PatientStatus) => setStatusFilter(value)}><SelectTrigger className="border-0 bg-transparent px-0 shadow-none focus:ring-0"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Все статусы</SelectItem><SelectItem value="active">Активные</SelectItem><SelectItem value="follow-up">Нужен контроль</SelectItem><SelectItem value="inactive">Неактивные</SelectItem></SelectContent></Select></div>
                <Select value={sortBy} onValueChange={(value: SortValue) => setSortBy(value)}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recent">Сначала последние визиты</SelectItem><SelectItem value="name">По имени</SelectItem><SelectItem value="risk">По уровню риска</SelectItem></SelectContent></Select>
              </div>
            </div>
            <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>{filteredPatients.length} пациентов в выдаче</span>
              {query || statusFilter !== "all" || sortBy !== "recent" ? (
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setSortBy("recent");
                    setSearchParams(
                      selectedPatient
                        ? new URLSearchParams({ patient: selectedPatient.id })
                        : new URLSearchParams(),
                    );
                  }}
                  className="rounded-xl px-3 py-1 text-primary transition-colors hover:bg-accent"
                >
                  Сбросить поиск
                </button>
              ) : null}
            </div>

            {filteredPatients.length === 0 ? (
              <StatePanel title="Ничего не найдено" description="Измените запрос или сбросьте фильтры, чтобы снова увидеть базу пациентов." actionLabel="Сбросить фильтры" onAction={() => { setStatusFilter("all"); setSortBy("recent"); setSearchParams(new URLSearchParams()); }} />
            ) : (
              <div className="space-y-3">
                {filteredPatients.map((patient) => {
                  const nextForPatient = getPatientNextAppointment(patient.id, appointments);
                  return (
                    <button key={patient.id} onClick={() => { const next = new URLSearchParams(searchParams); next.set("patient", patient.id); setSearchParams(next); }} className={`w-full rounded-[10px] border p-4 text-left transition-all duration-200 ease-out ${selectedPatient?.id === patient.id ? "border-primary/35 bg-primary/10 shadow-[0_10px_24px_-20px_rgba(45,70,91,0.16)] dark:border-primary/25 dark:bg-primary/10 dark:shadow-[0_10px_24px_-20px_rgba(142,176,183,0.22)]" : "border-border hover:border-primary/25 hover:bg-primary/[0.05] dark:hover:border-primary/20 dark:hover:bg-primary/[0.08]"}`}>
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-12 items-center justify-center rounded-[12px] bg-primary/10 text-sm font-semibold text-primary">{patient.initials}</div>
                          <div><div className="mb-1 flex flex-wrap items-center gap-2"><p className="font-medium text-foreground">{patient.fullName}</p><StatusBadge label={patientStatusLabels[patient.status]} status={patient.status} /></div><p className="text-[13px] text-muted-foreground">{calculateAge(patient.birthDate)} лет • {patient.diagnosis}</p></div>
                        </div>
                        <div className="text-right text-[11px] text-muted-foreground"><p>Последний визит</p><p className="font-medium text-foreground">{formatCompactDate(patient.lastVisitAt)}</p></div>
                      </div>
                      <div className="grid gap-2 text-[13px] text-muted-foreground md:grid-cols-3"><p>{patient.phone}</p><p>{patient.email}</p><p>{nextForPatient ? `Следующий прием ${formatCompactDate(nextForPatient.startAt)}` : "Следующий прием не назначен"}</p></div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            {selectedPatient ? (
              <>
                <div className="mb-6 flex items-start justify-between gap-4 border-b border-border pb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex size-20 items-center justify-center rounded-[16px] bg-primary/10 text-2xl font-semibold text-primary">{selectedPatient.initials}</div>
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold text-foreground">{selectedPatient.fullName}</h2><StatusBadge label={patientStatusLabels[selectedPatient.status]} status={selectedPatient.status} /></div>
                      <p className="text-[13px] text-muted-foreground">{calculateAge(selectedPatient.birthDate)} лет • {selectedPatient.city}</p>
                      <p className="mt-2 text-[13px] text-foreground">{selectedPatient.overview}</p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-2xl" onClick={() => setEditOpen(true)}><UserPen className="mr-2 size-4" />Редактировать</Button>
                </div>

                <div className="mb-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-muted/60 p-4"><p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Контакты</p><div className="space-y-2 text-[13px]"><p className="flex items-center gap-2 text-foreground"><Phone className="size-4 text-muted-foreground" />{selectedPatient.phone}</p><p className="flex items-center gap-2 text-foreground"><Mail className="size-4 text-muted-foreground" />{selectedPatient.email}</p><p className="flex items-center gap-2 text-foreground"><MapPin className="size-4 text-muted-foreground" />{selectedPatient.address}</p></div></div>
                  <div className="rounded-2xl bg-muted/60 p-4"><p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Сводка</p><div className="grid grid-cols-2 gap-3 text-[13px]"><div><p className="text-muted-foreground">АД</p><p className="font-medium text-foreground">{selectedPatient.metrics.bloodPressure}</p></div><div><p className="text-muted-foreground">Пульс</p><p className="font-medium text-foreground">{selectedPatient.metrics.pulse} уд/мин</p></div><div><p className="text-muted-foreground">SpO₂</p><p className="font-medium text-foreground">{selectedPatient.metrics.oxygenLevel}%</p></div><div><p className="text-muted-foreground">Температура</p><p className="font-medium text-foreground">{selectedPatient.metrics.temperature} °C</p></div></div></div>
                </div>

                <div className="mb-6 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-border p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Приемы</p>
                    <p className="mt-2 text-[22px] font-semibold leading-none text-foreground">{patientAppointments.length}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {nextAppointment ? `Следующий ${formatCompactDate(nextAppointment.startAt)}` : "Новых приемов нет"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Медкарты</p>
                    <p className="mt-2 text-[22px] font-semibold leading-none text-foreground">{patientRecords.length}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {latestRecord ? `Последняя ${formatCompactDate(latestRecord.createdAt)}` : "Записей пока нет"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Назначения</p>
                    <p className="mt-2 text-[22px] font-semibold leading-none text-foreground">{patientPrescriptions.length}</p>
                    <p className="text-[13px] text-muted-foreground">
                      {patientPrescriptions.length > 0 ? "Доступны в карточке пациента" : "Не оформлены"}
                    </p>
                  </div>
                </div>

                <div className="mb-6 flex flex-wrap gap-3">
                  <Button className="rounded-2xl" onClick={() => navigate(`/appointments?patient=${selectedPatient.id}&new=1`)}><CalendarPlus className="mr-2 size-4" />Новая запись</Button>
                  <Button variant="outline" className="rounded-2xl" onClick={() => navigate(`/records?patient=${selectedPatient.id}`)}><FileText className="mr-2 size-4" />Открыть медкарту</Button>
                  <Button variant="outline" className="rounded-2xl" onClick={() => navigate(`/prescriptions?patient=${selectedPatient.id}&new=1`)}>Новое назначение</Button>
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList className="mb-4 grid w-full grid-cols-4"><TabsTrigger value="overview">Обзор</TabsTrigger><TabsTrigger value="history">История</TabsTrigger><TabsTrigger value="appointments">Приемы</TabsTrigger><TabsTrigger value="prescriptions">Назначения</TabsTrigger></TabsList>
                  <TabsContent value="overview" className="space-y-4">
                    <div className="rounded-2xl border border-border p-4"><p className="mb-2 text-[13px] font-semibold text-foreground">Основная информация</p><div className="grid gap-3 text-[13px] md:grid-cols-2"><div><p className="text-muted-foreground">Диагноз</p><p className="font-medium text-foreground">{selectedPatient.diagnosis}</p></div><div><p className="text-muted-foreground">Последний врач</p><p className="font-medium text-foreground">{selectedPatient.lastDoctor}</p></div><div><p className="text-muted-foreground">Аллергии</p><p className="font-medium text-foreground">{selectedPatient.allergies.length ? selectedPatient.allergies.join(", ") : "Не указаны"}</p></div><div><p className="text-muted-foreground">Контакт ЧС</p><p className="font-medium text-foreground">{selectedPatient.emergencyContact}</p></div></div></div>
                    {latestRecord ? <button onClick={() => navigate(`/records/${latestRecord.id}`)} className="w-full rounded-2xl border border-border p-4 text-left transition-colors hover:bg-accent/40"><div className="mb-2 flex items-center justify-between gap-3"><p className="text-[13px] font-semibold text-foreground">Последняя медицинская запись</p><StatusBadge label={recordStatusLabels[latestRecord.status]} status={latestRecord.status} /></div><p className="mb-2 text-[13px] text-muted-foreground">{formatDisplayDateTime(latestRecord.createdAt)} • {latestRecord.doctorName}</p><p className="text-[13px] text-foreground">{latestRecord.diagnosis}</p></button> : null}
                    {nextAppointment ? <div className="rounded-2xl border border-border p-4"><p className="mb-2 text-[13px] font-semibold text-foreground">Следующий прием</p><p className="text-[13px] text-muted-foreground">{formatDisplayDateTime(nextAppointment.startAt)} • кабинет {nextAppointment.room}</p></div> : null}
                  </TabsContent>
                  <TabsContent value="history" className="space-y-3">{selectedPatient.medicalHistory.map((item) => <div key={item} className="rounded-2xl border border-border p-4 text-[13px]">{item}</div>)}</TabsContent>
                  <TabsContent value="appointments" className="space-y-3">{patientAppointments.length === 0 ? <StatePanel title="Нет записей" description="Для выбранного пациента еще нет приемов в расписании." /> : patientAppointments.map((appointment: Appointment) => <button key={appointment.id} onClick={() => navigate(`/appointments?appointment=${appointment.id}`)} className="w-full rounded-2xl border border-border p-4 text-left transition-colors hover:bg-accent/40"><div className="mb-2 flex items-center justify-between gap-3"><p className="text-[13px] font-medium text-foreground">{appointment.type}</p><StatusBadge label={appointmentStatusLabels[appointment.status]} status={appointment.status} /></div><p className="text-[13px] text-muted-foreground">{formatCompactDate(appointment.startAt)} в {formatDisplayTime(appointment.startAt)} • {appointment.department}</p></button>)}</TabsContent>
                  <TabsContent value="prescriptions" className="space-y-3">{patientPrescriptions.length === 0 ? <StatePanel title="Нет назначений" description="Назначения для пациента пока не оформлены." /> : patientPrescriptions.map((prescription) => <button key={prescription.id} onClick={() => navigate(`/prescriptions?prescription=${prescription.id}`)} className="w-full rounded-2xl border border-border p-4 text-left transition-colors hover:bg-accent/40"><div className="mb-2 flex items-center justify-between gap-3"><p className="text-[13px] font-medium text-foreground">{prescription.medication}</p><StatusBadge label={prescriptionStatusLabels[prescription.status]} status={prescription.status} /></div><p className="text-[13px] text-muted-foreground">{prescription.dosage} • {prescription.frequency}</p></button>)}</TabsContent>
                </Tabs>
              </>
            ) : (
              <StatePanel title="Выберите пациента" description="Выберите карточку слева, чтобы открыть детальную панель пациента." />
            )}
          </section>
        </div>

        <PatientFormDialog open={createOpen} mode="create" onOpenChange={(open) => { setCreateOpen(open); if (!open && searchParams.get("new")) { const next = new URLSearchParams(window.location.search); next.delete("new"); setSearchParams(next); } }} onSubmit={handleCreate} />
        <PatientFormDialog open={editOpen} mode="edit" patient={selectedPatient ?? undefined} onOpenChange={setEditOpen} onSubmit={handleEdit} />
      </div>
    </main>
  );
}
