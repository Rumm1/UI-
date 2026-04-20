import { useEffect, useMemo, useState } from "react";
import { PencilLine, Pill, Plus, Search, Trash2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useAppData } from "../contexts/AppDataContext";
import { MedicalRecord, NewPrescriptionInput, Patient, Prescription, PrescriptionStatus, UpdatePrescriptionInput } from "../types/medical";
import {
  formatCompactDate,
  getPatientById,
  prescriptionStatusLabels,
} from "../lib/prototype";
import { StatePanel } from "../components/shared/StatePanel";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Skeleton } from "../components/ui/skeleton";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
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

function buildPrescriptionFormState(
  patients: Patient[],
  initialPatientId?: string | null,
  initialRecord?: MedicalRecord | null,
  initialPrescription?: Prescription | null,
) {
  return {
    patientId: initialPrescription?.patientId ?? initialPatientId ?? patients[0]?.id ?? "",
    doctorName: initialPrescription?.doctorName ?? initialRecord?.doctorName ?? "Иванов И.И.",
    medication: initialPrescription?.medication ?? "",
    dosage: initialPrescription?.dosage ?? "",
    frequency: initialPrescription?.frequency ?? "",
    duration: initialPrescription?.duration ?? "",
    instructions: initialPrescription?.instructions ?? "",
    status: initialPrescription?.status ?? "draft" as PrescriptionStatus,
    expiresAt: initialPrescription?.expiresAt.slice(0, 10) ?? "2026-12-31",
  };
}

function isPrescriptionStatus(value: string | null): value is PrescriptionStatus {
  return value === "active" || value === "expired" || value === "draft";
}

function PrescriptionDialog({
  open,
  patients,
  initialRecord,
  initialPatientId,
  initialPrescription,
  mode,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  patients: Patient[];
  initialRecord?: MedicalRecord | null;
  initialPatientId?: string | null;
  initialPrescription?: Prescription | null;
  mode: "create" | "edit";
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: NewPrescriptionInput | UpdatePrescriptionInput) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(() =>
    buildPrescriptionFormState(patients, initialPatientId, initialRecord, initialPrescription),
  );
  const isValidForm =
    form.patientId.trim().length > 0 &&
    form.medication.trim().length > 0 &&
    form.dosage.trim().length > 0 &&
    form.frequency.trim().length > 0;

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(buildPrescriptionFormState(patients, initialPatientId, initialRecord, initialPrescription));
  }, [initialPatientId, initialPrescription, initialRecord, open, patients]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onSubmit({
        patientId: form.patientId,
        doctorName: form.doctorName,
        medication: form.medication,
        dosage: form.dosage,
        frequency: form.frequency,
        duration: form.duration,
        instructions: form.instructions,
        status: form.status,
        expiresAt: `${form.expiresAt}T23:59:00.000Z`,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader><DialogTitle>{mode === "create" ? "Новое назначение" : "Изменить назначение"}</DialogTitle></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><Label>Пациент</Label><Select value={form.patientId} onValueChange={(value) => setForm((c) => ({ ...c, patientId: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{patients.map((patient) => <SelectItem key={patient.id} value={patient.id}>{patient.fullName}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Врач</Label><Input value={form.doctorName} onChange={(e) => setForm((c) => ({ ...c, doctorName: e.target.value }))} /></div>
          <div><Label>Статус</Label><Select value={form.status} onValueChange={(value: PrescriptionStatus) => setForm((c) => ({ ...c, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Черновик</SelectItem><SelectItem value="active">Активен</SelectItem><SelectItem value="expired">Истек</SelectItem></SelectContent></Select></div>
          <div><Label>Препарат</Label><Input value={form.medication} onChange={(e) => setForm((c) => ({ ...c, medication: e.target.value }))} /></div>
          <div><Label>Дозировка</Label><Input value={form.dosage} onChange={(e) => setForm((c) => ({ ...c, dosage: e.target.value }))} /></div>
          <div><Label>Частота</Label><Input value={form.frequency} onChange={(e) => setForm((c) => ({ ...c, frequency: e.target.value }))} /></div>
          <div><Label>Курс</Label><Input value={form.duration} onChange={(e) => setForm((c) => ({ ...c, duration: e.target.value }))} /></div>
          <div><Label>Срок действия</Label><Input type="date" value={form.expiresAt} onChange={(e) => setForm((c) => ({ ...c, expiresAt: e.target.value }))} /></div>
          <div className="md:col-span-2"><Label>Инструкции</Label><Textarea rows={4} value={form.instructions} onChange={(e) => setForm((c) => ({ ...c, instructions: e.target.value }))} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button><Button disabled={submitting || !isValidForm} onClick={() => void handleSubmit()}>{submitting ? "Сохраняем..." : mode === "create" ? "Создать назначение" : "Сохранить изменения"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PrescriptionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addPrescription, bootstrapError, deletePrescription, isBootstrapping, patients, prescriptions, records, retryBootstrap, savePrescription } = useAppData();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const patientFromParams = searchParams.get("patient");
  const recordFromParams = searchParams.get("record");
  const selectedPrescriptionId = searchParams.get("prescription");
  const statusFilter = isPrescriptionStatus(searchParams.get("status"))
    ? searchParams.get("status")
    : "all";
  const selectedPatient = patientFromParams ? getPatientById(patients, patientFromParams) : null;
  const recordContext = recordFromParams
    ? records.find((item) => item.id === recordFromParams) ?? null
    : null;

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setCreateOpen(true);
    }
  }, [searchParams]);

  const filteredPrescriptions = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return [...prescriptions]
      .filter((item) => !patientFromParams || item.patientId === patientFromParams)
      .filter((item) => statusFilter === "all" || item.status === statusFilter)
      .filter((item) => !needle || [item.medication, item.doctorName, item.instructions, getPatientById(patients, item.patientId)?.fullName ?? ""].join(" ").toLowerCase().includes(needle))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [patientFromParams, patients, prescriptions, search, statusFilter]);

  const selectedPrescription = filteredPrescriptions.find((item) => item.id === selectedPrescriptionId) ?? filteredPrescriptions[0] ?? null;

  useEffect(() => {
    if (selectedPrescription && selectedPrescription.id !== selectedPrescriptionId) {
      const next = new URLSearchParams(searchParams);
      next.set("prescription", selectedPrescription.id);
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, selectedPrescription, selectedPrescriptionId, setSearchParams]);

  async function handleCreate(payload: NewPrescriptionInput | UpdatePrescriptionInput) {
    const prescription = await addPrescription({
      ...(payload as NewPrescriptionInput),
      recordId: recordContext?.id ?? null,
    });
    const next = new URLSearchParams(searchParams);
    next.delete("new");
    next.set("prescription", prescription.id);
    setSearchParams(next);
  }

  async function handleEdit(payload: NewPrescriptionInput | UpdatePrescriptionInput) {
    if (!selectedPrescription) return;
    const prescription = await savePrescription(selectedPrescription.id, {
      ...(payload as UpdatePrescriptionInput),
      recordId: selectedPrescription.recordId ?? null,
    });
    const next = new URLSearchParams(searchParams);
    next.set("prescription", prescription.id);
    setSearchParams(next);
  }

  async function handleDelete() {
    if (!selectedPrescription) return;
    await deletePrescription(selectedPrescription.id);
    const next = new URLSearchParams(searchParams);
    next.delete("prescription");
    setSearchParams(next);
    setDeleteOpen(false);
  }

  const cards = [
    {
      label: "Активные",
      value: prescriptions.filter((item) => item.status === "active").length,
      tone: "bg-emerald-100 text-emerald-700",
      onClick: () => {
        const next = new URLSearchParams(searchParams);
        next.set("status", "active");
        setSearchParams(next);
      },
    },
    {
      label: "Черновики",
      value: prescriptions.filter((item) => item.status === "draft").length,
      tone: "bg-slate-100 text-slate-700",
      onClick: () => {
        const next = new URLSearchParams(searchParams);
        next.set("status", "draft");
        setSearchParams(next);
      },
    },
    {
      label: "Истекшие",
      value: prescriptions.filter((item) => item.status === "expired").length,
      tone: "bg-amber-100 text-amber-700",
      onClick: () => {
        const next = new URLSearchParams(searchParams);
        next.set("status", "expired");
        setSearchParams(next);
      },
    },
  ];

  if (bootstrapError) {
    return <main className="flex-1 overflow-auto p-6"><StatePanel variant="error" title="Не удалось загрузить назначения" description={bootstrapError} actionLabel="Повторить" onAction={() => { void retryBootstrap(); }} /></main>;
  }

  if (isBootstrapping) {
    return <main className="flex-1 overflow-auto"><div className="mx-auto max-w-[1440px] p-6"><div className="mb-6 flex items-center justify-between"><div className="space-y-2"><Skeleton className="h-8 w-64 rounded-xl" /><Skeleton className="h-4 w-72 rounded-xl" /></div><Skeleton className="h-11 w-44 rounded-2xl" /></div><Skeleton className="h-[700px] rounded-3xl" /></div></main>;
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1440px] p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><h1 className="mb-1 text-2xl font-semibold text-foreground">Назначения</h1><p className="text-sm text-muted-foreground">Живой список рецептов и назначений со статусами active / expired / draft и действиями редактирования.</p></div>
          <Button className="rounded-2xl" onClick={() => setCreateOpen(true)}><Plus className="mr-2 size-4" />Создать назначение</Button>
        </div>

        {selectedPatient ? (
          <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-border bg-card p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[13px] font-medium text-foreground">Контекст пациента: {selectedPatient.fullName}</p>
              <p className="text-[13px] text-muted-foreground">
                {recordContext
                  ? `Новое назначение будет связано с медицинской записью от ${formatCompactDate(recordContext.createdAt)}.`
                  : "Список ограничен выбранным пациентом для правдоподобного сценария назначения."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={() => navigate(`/patients?patient=${selectedPatient.id}`)}>Профиль пациента</Button>
              <Button variant="outline" className="rounded-2xl" onClick={() => { const next = new URLSearchParams(searchParams); next.delete("patient"); next.delete("record"); setSearchParams(next); }}>Показать всех</Button>
            </div>
          </div>
        ) : null}

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {cards.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="font-medical-display flex h-[62px] items-center justify-between gap-3 rounded-[10px] border border-border bg-card px-4 py-3 text-left transition-colors hover:border-sky-300/35 hover:bg-sky-500/[0.04] dark:hover:border-sky-400/20 dark:hover:bg-sky-400/[0.08]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${item.tone}`}>
                  <Pill className="size-4" />
                </div>
                <p className="truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {item.label}
                </p>
              </div>
              <p className="shrink-0 text-[24px] font-semibold leading-none text-foreground">
                {item.value}
              </p>
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="mb-5 flex flex-col gap-3">
              <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" placeholder="Поиск по пациенту или препарату" /></div>
              <Select value={statusFilter} onValueChange={(value: "all" | PrescriptionStatus) => { const next = new URLSearchParams(searchParams); value === "all" ? next.delete("status") : next.set("status", value); setSearchParams(next); }}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Все статусы</SelectItem><SelectItem value="active">Активные</SelectItem><SelectItem value="draft">Черновики</SelectItem><SelectItem value="expired">Истекшие</SelectItem></SelectContent></Select>
            </div>

            {filteredPrescriptions.length === 0 ? (
              <StatePanel title="Нет назначений" description="Измените фильтр или создайте новое назначение на mock-данных." />
            ) : (
              <div className="space-y-3">
                {filteredPrescriptions.map((item) => {
                  const patient = getPatientById(patients, item.patientId);
                  return (
                    <button key={item.id} onClick={() => { const next = new URLSearchParams(searchParams); next.set("prescription", item.id); setSearchParams(next); }} className={`w-full rounded-[10px] border p-4 text-left transition-all duration-200 ease-out ${selectedPrescription?.id === item.id ? "border-sky-300/55 bg-sky-500/10 shadow-[0_10px_24px_-18px_rgba(14,165,233,0.85)] dark:border-sky-400/25 dark:bg-sky-400/10" : "border-border hover:border-sky-300/35 hover:bg-sky-500/[0.05] dark:hover:border-sky-400/20 dark:hover:bg-sky-400/[0.08]"}`}>
                      <div className="mb-2 flex items-center justify-between gap-3"><div><p className="text-[13px] font-medium text-foreground">{item.medication}</p><p className="text-[13px] text-muted-foreground">{patient?.fullName}</p></div><StatusBadge label={prescriptionStatusLabels[item.status]} status={item.status} /></div>
                      <p className="text-[13px] text-muted-foreground">{item.dosage} • {item.frequency}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            {selectedPrescription ? (
              (() => {
                const patient = getPatientById(patients, selectedPrescription.patientId);
                return (
                  <>
                    <div className="mb-6 border-b border-border pb-6">
                      <div className="mb-2 flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-foreground">{selectedPrescription.medication}</h2><p className="text-[13px] text-muted-foreground">{patient?.fullName}</p></div><StatusBadge label={prescriptionStatusLabels[selectedPrescription.status]} status={selectedPrescription.status} /></div>
                      <p className="text-[13px] text-muted-foreground">Назначил {selectedPrescription.doctorName}</p>
                    </div>
                    <div className="space-y-4">
                      <div><p className="text-[11px] text-muted-foreground">Дозировка</p><p className="text-[13px] font-medium text-foreground">{selectedPrescription.dosage}</p></div>
                      <div><p className="text-[11px] text-muted-foreground">Частота</p><p className="text-[13px] font-medium text-foreground">{selectedPrescription.frequency}</p></div>
                      <div><p className="text-[11px] text-muted-foreground">Курс</p><p className="text-[13px] font-medium text-foreground">{selectedPrescription.duration}</p></div>
                      <div><p className="text-[11px] text-muted-foreground">Инструкции</p><p className="text-[13px] text-foreground">{selectedPrescription.instructions}</p></div>
                      <div className="grid gap-3 md:grid-cols-2"><div><p className="text-[11px] text-muted-foreground">Создан</p><p className="text-[13px] font-medium text-foreground">{formatCompactDate(selectedPrescription.createdAt)}</p></div><div><p className="text-[11px] text-muted-foreground">Действует до</p><p className="text-[13px] font-medium text-foreground">{formatCompactDate(selectedPrescription.expiresAt)}</p></div></div>
                      <div className="flex flex-wrap gap-3">
                        {selectedPrescription.recordId ? <Button className="rounded-2xl" onClick={() => navigate(`/records/${selectedPrescription.recordId}`)}>Открыть медзапись</Button> : null}
                        <Button variant="outline" className="rounded-2xl" onClick={() => navigate(`/patients?patient=${selectedPrescription.patientId}`)}>Открыть пациента</Button>
                        <Button variant="outline" className="rounded-2xl" onClick={() => setEditOpen(true)}><PencilLine className="mr-2 size-4" />Изменить</Button>
                        <Button variant="outline" className="rounded-2xl text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="mr-2 size-4" />Удалить</Button>
                      </div>
                    </div>
                  </>
                );
              })()
            ) : (
              <StatePanel title="Выберите назначение" description="Откройте назначение слева или создайте новое из mock-формы." />
            )}
          </section>
        </div>

        <PrescriptionDialog open={createOpen} mode="create" patients={patients} initialPatientId={patientFromParams} initialRecord={recordContext} onOpenChange={(open) => { setCreateOpen(open); if (!open && searchParams.get("new")) { const next = new URLSearchParams(window.location.search); next.delete("new"); setSearchParams(next); } }} onSubmit={handleCreate} />
        <PrescriptionDialog open={editOpen} mode="edit" patients={patients} initialPrescription={selectedPrescription ?? undefined} onOpenChange={setEditOpen} onSubmit={handleEdit} />

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить назначение?</AlertDialogTitle>
              <AlertDialogDescription>
                Назначение будет удалено из demo-прототипа и исчезнет из списка рецептов.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-2xl">Отмена</AlertDialogCancel>
              <AlertDialogAction className="rounded-2xl" onClick={() => { void handleDelete(); }}>
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
}
