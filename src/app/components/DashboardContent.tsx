import { useState } from "react";
import {
  Activity,
  Calendar,
  ClipboardList,
  FileText,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router";
import {
  eachDayOfInterval,
  eachWeekOfInterval,
  endOfWeek,
  format,
  isWithinInterval,
  startOfDay,
  endOfDay,
  startOfWeek,
} from "date-fns";
import { ru } from "date-fns/locale";
import { useAppData } from "../contexts/AppDataContext";
import { DashboardPeriod } from "../types/medical";
import { AnalyticsChart } from "./AnalyticsChart";
import { NotificationsPanel } from "./NotificationsPanel";
import { PatientsTable } from "./PatientsTable";
import { StatsCards } from "./StatsCards";
import { TasksList } from "./TasksList";
import { UpcomingAppointments } from "./UpcomingAppointments";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { StatePanel } from "./shared/StatePanel";
import { getPeriodLabel, getPeriodRange } from "../lib/prototype";

const periods: DashboardPeriod[] = ["day", "week", "month"];
const periodLabels: Record<DashboardPeriod, string> = {
  day: "День",
  week: "Неделя",
  month: "Месяц",
};

function buildDashboardSeries(
  period: DashboardPeriod,
  referenceDate: Date,
  appointments: { startAt: string; patientId: string }[],
  records: { createdAt: string; patientId: string }[],
) {
  const { start, end } = getPeriodRange(period, referenceDate);

  if (period === "day") {
    const slots = [8, 10, 12, 14, 16, 18];
    return slots.map((hour) => {
      const bucketStart = new Date(start);
      bucketStart.setHours(hour, 0, 0, 0);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setHours(hour + 2, 0, 0, 0);

      const bucketAppointments = appointments.filter((item) =>
        isWithinInterval(new Date(item.startAt), { start: bucketStart, end: bucketEnd }),
      );
      const bucketRecords = records.filter((item) =>
        isWithinInterval(new Date(item.createdAt), { start: bucketStart, end: bucketEnd }),
      );

      return {
        label: `${hour}:00`,
        appointments: bucketAppointments.length,
        records: bucketRecords.length,
        patients: new Set(
          [...bucketAppointments, ...bucketRecords].map((item) => item.patientId),
        ).size,
      };
    });
  }

  if (period === "week") {
    return eachDayOfInterval({ start, end }).map((date) => {
      const bucketStart = startOfDay(date);
      const bucketEnd = endOfDay(date);
      const bucketAppointments = appointments.filter((item) =>
        isWithinInterval(new Date(item.startAt), { start: bucketStart, end: bucketEnd }),
      );
      const bucketRecords = records.filter((item) =>
        isWithinInterval(new Date(item.createdAt), { start: bucketStart, end: bucketEnd }),
      );

      return {
        label: format(date, "EE", { locale: ru }),
        appointments: bucketAppointments.length,
        records: bucketRecords.length,
        patients: new Set(
          [...bucketAppointments, ...bucketRecords].map((item) => item.patientId),
        ).size,
      };
    });
  }

  return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 }).map((date) => {
    const bucketStart = startOfWeek(date, { weekStartsOn: 1 });
    const bucketEnd = endOfWeek(date, { weekStartsOn: 1 });
    const bucketAppointments = appointments.filter((item) =>
      isWithinInterval(new Date(item.startAt), { start: bucketStart, end: bucketEnd }),
    );
    const bucketRecords = records.filter((item) =>
      isWithinInterval(new Date(item.createdAt), { start: bucketStart, end: bucketEnd }),
    );

    return {
      label: `${format(bucketStart, "dd MMM", { locale: ru })}`,
      appointments: bucketAppointments.length,
      records: bucketRecords.length,
      patients: new Set(
        [...bucketAppointments, ...bucketRecords].map((item) => item.patientId),
      ).size,
    };
  });
}

export function DashboardContent() {
  const navigate = useNavigate();
  const {
    appointments,
    bootstrapError,
    isBootstrapping,
    notifications,
    patients,
    profile,
    records,
    retryBootstrap,
    tasks,
    toggleTaskState,
  } = useAppData();
  const [period, setPeriod] = useState<DashboardPeriod>("week");

  const referenceDate = new Date();
  const { start, end } = getPeriodRange(period, referenceDate);

  const appointmentsInRange = appointments.filter((item) =>
    isWithinInterval(new Date(item.startAt), { start, end }),
  );
  const recordsInRange = records.filter((item) =>
    isWithinInterval(new Date(item.createdAt), { start, end }),
  );
  const uniquePatients = new Set(
    [...appointmentsInRange, ...recordsInRange].map((item) => item.patientId),
  ).size;
  const confirmedCount = appointmentsInRange.filter(
    (item) => item.status === "confirmed" || item.status === "completed",
  ).length;
  const pendingCount = appointmentsInRange.filter(
    (item) => item.status === "pending",
  ).length;
  const openRecordCount = recordsInRange.filter(
    (item) => item.status === "draft" || item.status === "review",
  ).length;

  const chartData = buildDashboardSeries(period, referenceDate, appointments, records);

  const upcomingAppointments = [...appointments]
    .filter((item) => new Date(item.startAt).getTime() >= Date.now())
    .sort(
      (left, right) =>
        new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
    )
    .slice(0, 4);

  const highlightedPatients = [...patients]
    .sort((left, right) => new Date(right.lastVisitAt).getTime() - new Date(left.lastVisitAt).getTime())
    .slice(0, 5);

  const recentNotifications = notifications.slice(0, 4);

  const statItems = [
    {
      id: "appointments",
      label: "Приемы в периоде",
      value: String(appointmentsInRange.length),
      description: getPeriodLabel(period, referenceDate),
      icon: Calendar,
      accentClassName: "bg-primary/15 text-primary",
      onClick: () => navigate("/appointments"),
    },
    {
      id: "confirmed",
      label: "Подтверждено и завершено",
      value: String(confirmedCount),
      description:
        appointmentsInRange.length > 0
          ? `${Math.round((confirmedCount / appointmentsInRange.length) * 100)}% от расписания`
          : "Нет приемов в выбранном периоде",
      icon: Activity,
      accentClassName: "bg-emerald-100 text-emerald-700",
      onClick: () => navigate("/appointments?status=confirmed"),
    },
    {
      id: "patients",
      label: "Пациенты в работе",
      value: String(uniquePatients),
      description: "Уникальные пациенты по визитам и медкартам",
      icon: Users,
      accentClassName: "bg-sky-100 text-sky-700",
      onClick: () => navigate("/patients"),
    },
    {
      id: "records",
      label: "Медицинские записи",
      value: String(recordsInRange.length),
      description:
        openRecordCount > 0
          ? `${openRecordCount} требуют завершения`
          : "Все записи в периоде закрыты",
      icon: FileText,
      accentClassName: "bg-violet-100 text-violet-700",
      onClick: () =>
        navigate(openRecordCount > 0 ? "/records?status=open" : "/records"),
    },
  ];

  if (bootstrapError) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <StatePanel
          variant="error"
          title="Не удалось загрузить dashboard"
          description={bootstrapError}
          actionLabel="Повторить загрузку"
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
          <div className="mb-6 space-y-2">
            <Skeleton className="h-8 w-72 rounded-xl" />
            <Skeleton className="h-4 w-48 rounded-xl" />
          </div>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-36 rounded-3xl" />
            ))}
          </div>
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Skeleton className="h-96 rounded-3xl lg:col-span-2" />
            <Skeleton className="h-96 rounded-3xl" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Skeleton className="h-96 rounded-3xl lg:col-span-2" />
            <Skeleton className="h-96 rounded-3xl" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="mx-auto max-w-[1440px] p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-semibold text-foreground">
              Добрый день, {profile.fullName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Центр управления клиникой на mock-данных. Все действия отражаются между страницами.
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 lg:items-end">
            <div className="flex items-center gap-2 rounded-2xl bg-muted p-1">
              {periods.map((item) => (
                <button
                  key={item}
                  onClick={() => setPeriod(item)}
                  className={`rounded-2xl px-4 py-2 text-sm transition-colors ${
                    period === item
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {periodLabels[item]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => navigate("/patients?new=1")}
              >
                Новый пациент
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => navigate("/appointments?new=1")}
              >
                Новый прием
              </Button>
              <Button
                className="rounded-2xl"
                onClick={() => navigate("/records?new=1")}
              >
                Новая запись
              </Button>
            </div>
          </div>
        </div>

        <StatsCards items={statItems} />

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UpcomingAppointments
              appointments={upcomingAppointments}
              patients={patients}
            />
          </div>
          <div>
            <NotificationsPanel notifications={recentNotifications} />
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PatientsTable patients={highlightedPatients} />
          </div>
          <div>
            <TasksList
              tasks={tasks}
              onToggle={(taskId) => {
                void toggleTaskState(taskId);
              }}
            />
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <ClipboardList className="size-4" />
          Аналитика за период: {getPeriodLabel(period, referenceDate)}
        </div>
        <AnalyticsChart
          title="Клиническая активность"
          description="График меняется в зависимости от выбранного периода day / week / month."
          data={chartData}
        />
      </div>
    </main>
  );
}
