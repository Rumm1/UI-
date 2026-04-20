import { useEffect, useMemo, useState } from "react";
import { FilePlus2, Search } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useAppData } from "../contexts/AppDataContext";
import { Appointment, NewMedicalRecordInput, Patient, RecordStatus } from "../types/medical";
import {
  formatDisplayDateTime,
  getPatientById,
  recordStatusLabels,
} from "../lib/prototype";
import { StatePanel } from "../components/shared/StatePanel";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

function buildMedicalRecordFormState(
  patients: Patient[],
  initialPatientId?: string | null,
  initialAppointment?: Appointment | null,
) {
  return {
    patientId: initialPatientId ?? patients[0]?.id ?? "",
    doctorName: initialAppointment?.doctorName ?? "Иванов И.И.",
    specialty: initialAppointment?.department ?? "Терапевт",
    visitType: initialAppointment?.type ?? "Повторный прием",
    status: "draft" as RecordStatus,
    complaints: "",
    examination: "",
    diagnosis: "",
    treatment: "",
    recommendations: "",
  };
}

function isRecordStatus(value: string | null): value is RecordStatus {
  return value === "draft" || value === "review" || value === "final";
}

function MedicalRecordDialog({
  open,
  patients,
  initialAppointment,
  initialPatientId,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  patients: Patient[];
  initialAppointment?: Appointment | null;
  initialPatientId?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: NewMedicalRecordInput) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() =>
    buildMedicalRecordFormState(patients, initialPatientId, initialAppointment),
  );
  const isValidForm =
    form.patientId.trim().length > 0 &&
    form.complaints.trim().length > 0 &&
    form.examination.trim().length > 0 &&
    form.diagnosis.trim().length > 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(buildMedicalRecordFormState(patients, initialPatientId, initialAppointment));
  }, [initialAppointment, initialPatientId, open, patients]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit(form);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl">
        <DialogHeader><DialogTitle>Новая медицинская запись</DialogTitle></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><Label>Пациент</Label><Select value={form.patientId} onValueChange={(value) => setForm((c) => ({ ...c, patientId: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{patients.map((patient) => <SelectItem key={patient.id} value={patient.id}>{patient.fullName}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Врач</Label><Input value={form.doctorName} onChange={(e) => setForm((c) => ({ ...c, doctorName: e.target.value }))} /></div>
          <div><Label>Специальность</Label><Input value={form.specialty} onChange={(e) => setForm((c) => ({ ...c, specialty: e.target.value }))} /></div>
          <div><Label>Тип визита</Label><Input value={form.visitType} onChange={(e) => setForm((c) => ({ ...c, visitType: e.target.value }))} /></div>
          <div><Label>Статус</Label><Select value={form.status} onValueChange={(value: RecordStatus) => setForm((c) => ({ ...c, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Черновик</SelectItem><SelectItem value="review">На проверке</SelectItem><SelectItem value="final">Закрыта</SelectItem></SelectContent></Select></div>
          <div className="md:col-span-2"><Label>Жалобы</Label><Textarea rows={3} value={form.complaints} onChange={(e) => setForm((c) => ({ ...c, complaints: e.target.value }))} /></div>
          <div className="md:col-span-2"><Label>Осмотр</Label><Textarea rows={3} value={form.examination} onChange={(e) => setForm((c) => ({ ...c, examination: e.target.value }))} /></div>
          <div className="md:col-span-2"><Label>Диагноз</Label><Textarea rows={2} value={form.diagnosis} onChange={(e) => setForm((c) => ({ ...c, diagnosis: e.target.value }))} /></div>
          <div className="md:col-span-2"><Label>Лечение</Label><Textarea rows={3} value={form.treatment} onChange={(e) => setForm((c) => ({ ...c, treatment: e.target.value }))} /></div>
          <div className="md:col-span-2"><Label>Рекомендации</Label><Textarea rows={3} value={form.recommendations} onChange={(e) => setForm((c) => ({ ...c, recommendations: e.target.value }))} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button><Button disabled={submitting || !isValidForm} onClick={() => void handleSubmit()}>{submitting ? "Сохраняем..." : "Создать запись"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MedicalRecordsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addMedicalRecord, appointments, bootstrapError, isBootstrapping, patients, records, retryBootstrap } = useAppData();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const patientFromParams = searchParams.get("patient");
  const appointmentFromParams = searchParams.get("appointment");
  const selectedRecordId = searchParams.get("record");
  const statusFilter = isRecordStatus(searchParams.get("status"))
    ? searchParams.get("status")
    : searchParams.get("status") === "open"
      ? "open"
      : "all";
  const selectedPatient = patientFromParams ? getPatientById(patients, patientFromParams) : null;
  const appointmentContext = appointmentFromParams
    ? appointments.find((item) => item.id === appointmentFromParams) ?? null
    : null;

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCreateOpen(true);
    }
  }, [searchParams]);

  const filteredRecords = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return [...records]
      .filter((record) => !patientFromParams || record.patientId === patientFromParams)
      .filter((record) =>
        statusFilter === "all"
          ? true
          : statusFilter === "open"
            ? record.status !== "final"
            : record.status === statusFilter,
      )
      .filter((record) => !needle || [record.diagnosis, record.doctorName, record.visitType, getPatientById(patients, record.patientId)?.fullName ?? ""].join(" ").toLowerCase().includes(needle))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [patientFromParams, patients, records, search, statusFilter]);

  const selectedRecord = filteredRecords.find((record) => record.id === selectedRecordId) ?? filteredRecords[0] ?? null;

  useEffect(() => {
    if (selectedRecord && selectedRecord.id !== selectedRecordId) {
      const next = new URLSearchParams(searchParams);
      next.set("record", selectedRecord.id);
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, selectedRecord, selectedRecordId, setSearchParams]);

  async function handleCreate(payload: NewMedicalRecordInput) {
    const record = await addMedicalRecord({
      ...payload,
      appointmentId: appointmentContext?.id ?? null,
    });
    const next = new URLSearchParams(searchParams);
    next.delete("new");
    next.set("record", record.id);
    next.set("patient", record.patientId);
    setSearchParams(next);
  }

  if (bootstrapError) {
    return <main className="flex-1 overflow-auto p-6"><StatePanel variant="error" title="Не удалось загрузить медкарты" description={bootstrapError} actionLabel="Повторить" onAction={() => { void retryBootstrap(); }} /></main>;
  }

  if (isBootstrapping) {
    return <main className="flex-1 overflow-auto"><div className="mx-auto max-w-[1440px] p-6"><div className="mb-6 flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-8 w-64 rounded-xl" /><Skeleton className="h-4 w-72 rounded-xl" /></div><Skeleton className="h-11 w-40 rounded-2xl" /></div><div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]"><Skeleton className="h-[700px] rounded-3xl" /><Skeleton className="h-[700px] rounded-3xl" /></div></div></main>;
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1440px] p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><h1 className="mb-1 text-2xl font-semibold text-foreground">Медицинские записи</h1><p className="text-sm text-muted-foreground">Правдоподобная структура clinical note: complaints, examination, diagnosis, treatment, recommendations.</p></div>
          <Button className="rounded-2xl" onClick={() => setCreateOpen(true)}><FilePlus2 className="mr-2 size-4" />Новая запись</Button>
        </div>

        {selectedPatient ? (
          <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Фокус на пациенте: {selectedPatient.fullName}</p>
              <p className="text-sm text-muted-foreground">
                {appointmentContext
                  ? `Новая запись будет связана с приемом ${formatDisplayDateTime(appointmentContext.startAt)}.`
                  : "Список и форма сейчас сфокусированы на одном пациенте для связного demo-сценария."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => navigate(`/patients?patient=${selectedPatient.id}`)}>Профиль пациента</Button>
              <Button variant="outline" className="rounded-2xl" onClick={() => { const next = new URLSearchParams(searchParams); next.delete("patient"); next.delete("appointment"); setSearchParams(next); }}>Показать всех</Button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-5 flex flex-col gap-3">
              <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" placeholder="Поиск по пациенту, врачу или диагнозу" /></div>
              <Select value={statusFilter} onValueChange={(value: "all" | RecordStatus | "open") => { const next = new URLSearchParams(searchParams); value === "all" ? next.delete("status") : next.set("status", value); setSearchParams(next); }}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Все статусы</SelectItem><SelectItem value="open">Открытые</SelectItem><SelectItem value="draft">Черновики</SelectItem><SelectItem value="review">На проверке</SelectItem><SelectItem value="final">Закрытые</SelectItem></SelectContent></Select>
            </div>

            {filteredRecords.length === 0 ? (
              <StatePanel title="Нет медицинских записей" description="Создайте первую запись или измените фильтры, чтобы увидеть результаты." />
            ) : (
              <div className="space-y-3">
                {filteredRecords.map((record) => {
                  const patient = getPatientById(patients, record.patientId);
                  return (
                    <button key={record.id} onClick={() => { const next = new URLSearchParams(searchParams); next.set("record", record.id); next.set("patient", record.patientId); setSearchParams(next); }} className={`w-full rounded-2xl border p-4 text-left transition-colors hover:bg-accent/40 ${selectedRecord?.id === record.id ? "border-primary bg-primary/5" : "border-border"}`}>
                      <div className="mb-2 flex items-center justify-between gap-3"><div><p className="font-medium text-foreground">{patient?.fullName}</p><p className="text-sm text-muted-foreground">{record.visitType}</p></div><StatusBadge label={recordStatusLabels[record.status]} status={record.status} /></div>
                      <p className="mb-2 text-sm text-muted-foreground">{record.doctorName} • {formatDisplayDateTime(record.createdAt)}</p>
                      <p className="text-sm text-foreground">{record.diagnosis}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            {selectedRecord ? (
              (() => {
                const patient = getPatientById(patients, selectedRecord.patientId);
                return (
                  <>
                    <div className="mb-6 border-b border-border pb-6">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div><h2 className="text-xl font-semibold text-foreground">{patient?.fullName}</h2><p className="text-sm text-muted-foreground">{selectedRecord.visitType} • {formatDisplayDateTime(selectedRecord.createdAt)}</p></div>
                        <StatusBadge label={recordStatusLabels[selectedRecord.status]} status={selectedRecord.status} />
                      </div>
                      <div className="grid gap-3 text-sm md:grid-cols-2"><div><p className="text-muted-foreground">Врач</p><p className="font-medium text-foreground">{selectedRecord.doctorName}</p></div><div><p className="text-muted-foreground">Специальность</p><p className="font-medium text-foreground">{selectedRecord.specialty}</p></div></div>
                    </div>
                    <div className="space-y-5">
                      <div><p className="mb-1 text-sm font-semibold text-foreground">Жалобы</p><p className="text-sm leading-6 text-foreground">{selectedRecord.complaints}</p></div>
                      <div><p className="mb-1 text-sm font-semibold text-foreground">Осмотр</p><p className="text-sm leading-6 text-foreground">{selectedRecord.examination}</p></div>
                      <div><p className="mb-1 text-sm font-semibold text-foreground">Диагноз</p><div className="rounded-2xl bg-primary/10 p-4 text-sm font-medium text-foreground">{selectedRecord.diagnosis}</div></div>
                      <div><p className="mb-1 text-sm font-semibold text-foreground">Лечение</p><p className="text-sm leading-6 text-foreground">{selectedRecord.treatment}</p></div>
                      <div><p className="mb-1 text-sm font-semibold text-foreground">Рекомендации</p><p className="text-sm leading-6 text-foreground">{selectedRecord.recommendations}</p></div>
                      <div className="flex flex-wrap gap-3">
                        <Button className="rounded-2xl" onClick={() => navigate(`/prescriptions?patient=${selectedRecord.patientId}&record=${selectedRecord.id}&new=1`)}>Создать назначение</Button>
                        <Button variant="outline" className="rounded-2xl" onClick={() => navigate(`/patients?patient=${selectedRecord.patientId}`)}>Открыть пациента</Button>
                      </div>
                      <div><p className="mb-2 text-sm font-semibold text-foreground">Лабораторные результаты</p><div className="space-y-2">{selectedRecord.labResults.length ? selectedRecord.labResults.map((item) => <div key={item.name} className="flex items-center justify-between rounded-2xl border border-border p-3 text-sm"><div><p className="font-medium text-foreground">{item.name}</p><p className="text-muted-foreground">{formatDisplayDateTime(item.date)}</p></div><Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">{item.status}</Badge></div>) : <StatePanel title="Нет приложенных исследований" description="Для этой записи пока не добавлены лабораторные вложения." />}</div></div>
                    </div>
                  </>
                );
              })()
            ) : (
              <StatePanel title="Выберите запись" description="Откройте запись слева или создайте новую медицинскую запись из mock-формы." />
            )}
          </section>
        </div>

        <MedicalRecordDialog open={createOpen} patients={patients} initialPatientId={patientFromParams} initialAppointment={appointmentContext} onOpenChange={(open) => { setCreateOpen(open); if (!open && searchParams.get("new")) { const next = new URLSearchParams(window.location.search); next.delete("new"); setSearchParams(next); } }} onSubmit={handleCreate} />
      </div>
    </main>
  );
}
