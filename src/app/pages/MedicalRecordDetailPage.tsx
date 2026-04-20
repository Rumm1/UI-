import { ArrowLeft, Pill, UserRound } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useAppData } from "../contexts/AppDataContext";
import { formatDisplayDateTime, getPatientById, recordStatusLabels } from "../lib/prototype";
import { StatePanel } from "../components/shared/StatePanel";
import { StatusBadge } from "../components/shared/StatusBadge";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

export function MedicalRecordDetailPage() {
  const navigate = useNavigate();
  const { recordId } = useParams();
  const [searchParams] = useSearchParams();
  const { bootstrapError, isBootstrapping, patients, records, retryBootstrap } = useAppData();

  const record = records.find((item) => item.id === recordId) ?? null;
  const patient = record ? getPatientById(patients, record.patientId) : null;
  const backParams = new URLSearchParams();
  const statusFilter = searchParams.get("status");

  if (statusFilter) {
    backParams.set("status", statusFilter);
  }

  const backTarget = backParams.toString() ? `/records?${backParams.toString()}` : "/records";

  if (bootstrapError) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <StatePanel
          variant="error"
          title="Не удалось открыть медкарту"
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
        <div className="mx-auto max-w-[1200px] p-6">
          <div className="mb-6 flex items-center gap-3">
            <Skeleton className="h-11 w-40 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64 rounded-xl" />
              <Skeleton className="h-4 w-72 rounded-xl" />
            </div>
          </div>
          <Skeleton className="h-[760px] rounded-3xl" />
        </div>
      </main>
    );
  }

  if (!record || !patient) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <StatePanel
          title="Медкарта не найдена"
          description="Запись могла быть удалена или больше не существует в текущем demo-состоянии."
          actionLabel="Назад к списку"
          onAction={() => navigate(backTarget)}
        />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1200px] p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-2xl" onClick={() => navigate(backTarget)}>
              <ArrowLeft className="size-4" />
              Назад
            </Button>
            <div>
              <h1 className="mb-1 text-2xl font-semibold text-foreground">Медкарта пациента</h1>
              <p className="text-sm text-muted-foreground">
                Полная медицинская запись открыта на отдельной странице.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              className="rounded-2xl"
              onClick={() => navigate(`/prescriptions?patient=${record.patientId}&record=${record.id}&new=1`)}
            >
              <Pill className="mr-2 size-4" />
              Создать назначение
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => navigate(`/patients?patient=${record.patientId}`)}
            >
              <UserRound className="mr-2 size-4" />
              Профиль пациента
            </Button>
          </div>
        </div>

        <section className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-6 border-b border-border pb-6">
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">{patient.fullName}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {record.visitType} • {formatDisplayDateTime(record.createdAt)}
                </p>
              </div>
              <StatusBadge label={recordStatusLabels[record.status]} status={record.status} />
            </div>
            <div className="grid gap-4 text-sm md:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Врач</p>
                <p className="font-medium text-foreground">{record.doctorName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Специальность</p>
                <p className="font-medium text-foreground">{record.specialty}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Пациент</p>
                <p className="font-medium text-foreground">{patient.diagnosis}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Жалобы</p>
              <p className="text-sm leading-6 text-foreground">{record.complaints}</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Осмотр</p>
              <p className="text-sm leading-6 text-foreground">{record.examination}</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Диагноз</p>
              <div className="rounded-2xl bg-primary/10 p-4 text-sm font-medium text-foreground">
                {record.diagnosis}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Лечение</p>
              <p className="text-sm leading-6 text-foreground">{record.treatment}</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Рекомендации</p>
              <p className="text-sm leading-6 text-foreground">{record.recommendations}</p>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-foreground">Лабораторные результаты</p>
              <div className="space-y-2">
                {record.labResults.length > 0 ? (
                  record.labResults.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-2xl border border-border p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-muted-foreground">{formatDisplayDateTime(item.date)}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className="rounded-[10px] border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700"
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <StatePanel
                    title="Нет приложенных исследований"
                    description="Для этой записи пока не добавлены лабораторные вложения."
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
