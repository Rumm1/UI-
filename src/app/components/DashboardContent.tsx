import { useState } from "react";
import { Activity, Calendar, FileText, Users } from "lucide-react";
import { isWithinInterval } from "date-fns";
import { useNavigate } from "react-router";
import { useAppData } from "../contexts/AppDataContext";
import { getPeriodLabel, getPeriodRange } from "../lib/prototype";
import { DashboardPeriod } from "../types/medical";
import { PatientsTable } from "./PatientsTable";
import { StatePanel } from "./shared/StatePanel";
import { StatsCards } from "./StatsCards";
import { TasksList } from "./TasksList";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { UpcomingAppointments } from "./UpcomingAppointments";

const periods: DashboardPeriod[] = ["day", "week", "month"];

const periodLabels: Record<DashboardPeriod, string> = {
  day: "\u0414\u0435\u043d\u044c",
  week: "\u041d\u0435\u0434\u0435\u043b\u044f",
  month: "\u041c\u0435\u0441\u044f\u0446",
};

export function DashboardContent() {
  const navigate = useNavigate();
  const {
    appointments,
    bootstrapError,
    isBootstrapping,
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
  const openRecordCount = recordsInRange.filter(
    (item) => item.status === "draft" || item.status === "review",
  ).length;

  const upcomingAppointments = [...appointments]
    .filter((item) => new Date(item.startAt).getTime() >= Date.now())
    .sort(
      (left, right) =>
        new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
    )
    .slice(0, 4);

  const highlightedPatients = [...patients]
    .sort(
      (left, right) =>
        new Date(right.lastVisitAt).getTime() -
        new Date(left.lastVisitAt).getTime(),
    )
    .slice(0, 5);

  const statItems = [
    {
      id: "appointments",
      label: "\u041f\u0440\u0438\u0435\u043c\u044b \u0432 \u043f\u0435\u0440\u0438\u043e\u0434\u0435",
      value: String(appointmentsInRange.length),
      description: getPeriodLabel(period, referenceDate),
      icon: Calendar,
      accentClassName: "bg-primary/12 text-primary dark:bg-primary/18 dark:text-primary",
      onClick: () => navigate("/appointments"),
    },
    {
      id: "confirmed",
      label:
        "\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043d\u043e \u0438 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u043e",
      value: String(confirmedCount),
      description:
        appointmentsInRange.length > 0
          ? `${Math.round((confirmedCount / appointmentsInRange.length) * 100)}% \u043e\u0442 \u0440\u0430\u0441\u043f\u0438\u0441\u0430\u043d\u0438\u044f`
          : "\u041d\u0435\u0442 \u043f\u0440\u0438\u0435\u043c\u043e\u0432 \u0432 \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u043e\u043c \u043f\u0435\u0440\u0438\u043e\u0434\u0435",
      icon: Activity,
      accentClassName: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
      onClick: () => navigate("/appointments?status=confirmed"),
    },
    {
      id: "patients",
      label:
        "\u041f\u0430\u0446\u0438\u0435\u043d\u0442\u044b \u0432 \u0440\u0430\u0431\u043e\u0442\u0435",
      value: String(uniquePatients),
      description:
        "\u0423\u043d\u0438\u043a\u0430\u043b\u044c\u043d\u044b\u0435 \u043f\u0430\u0446\u0438\u0435\u043d\u0442\u044b \u043f\u043e \u0432\u0438\u0437\u0438\u0442\u0430\u043c \u0438 \u043c\u0435\u0434\u043a\u0430\u0440\u0442\u0430\u043c",
      icon: Users,
      accentClassName: "bg-primary/12 text-primary dark:bg-primary/18 dark:text-primary",
      onClick: () => navigate("/patients"),
    },
    {
      id: "records",
      label:
        "\u041c\u0435\u0434\u0438\u0446\u0438\u043d\u0441\u043a\u0438\u0435 \u0437\u0430\u043f\u0438\u0441\u0438",
      value: String(recordsInRange.length),
      description:
        openRecordCount > 0
          ? `${openRecordCount} \u0442\u0440\u0435\u0431\u0443\u044e\u0442 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0438\u044f`
          : "\u0412\u0441\u0435 \u0437\u0430\u043f\u0438\u0441\u0438 \u0432 \u043f\u0435\u0440\u0438\u043e\u0434\u0435 \u0437\u0430\u043a\u0440\u044b\u0442\u044b",
      icon: FileText,
      accentClassName: "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-200",
      onClick: () =>
        navigate(openRecordCount > 0 ? "/records?status=open" : "/records"),
    },
  ];

  if (bootstrapError) {
    return (
      <main className="flex-1 overflow-auto p-6">
        <StatePanel
          variant="error"
          title="\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c dashboard"
          description={bootstrapError}
          actionLabel="\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0443"
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
          <div className="mb-6">
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
              {"\u0414\u043e\u0431\u0440\u044b\u0439 \u0434\u0435\u043d\u044c, "}
              {profile.fullName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {
                "\u0426\u0435\u043d\u0442\u0440 \u0443\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f \u043a\u043b\u0438\u043d\u0438\u043a\u043e\u0439 \u043d\u0430 mock-\u0434\u0430\u043d\u043d\u044b\u0445. \u0412\u0441\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f \u043e\u0442\u0440\u0430\u0436\u0430\u044e\u0442\u0441\u044f \u043c\u0435\u0436\u0434\u0443 \u0441\u0442\u0440\u0430\u043d\u0438\u0446\u0430\u043c\u0438."
              }
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 lg:items-end">
            <div className="flex items-center gap-2 rounded-[10px] bg-muted p-1">
              {periods.map((item) => (
                <button
                  key={item}
                  onClick={() => setPeriod(item)}
                  className={`rounded-[10px] border px-4 py-2 text-sm transition-all duration-200 ease-out ${
                    period === item
                      ? "border-primary/35 bg-primary/10 text-foreground shadow-[0_10px_24px_-20px_rgba(45,70,91,0.16)] dark:border-primary/25 dark:bg-primary/10 dark:text-foreground dark:shadow-[0_10px_24px_-20px_rgba(142,176,183,0.22)]"
                      : "border-transparent text-muted-foreground hover:border-primary/25 hover:bg-primary/[0.05] hover:text-foreground dark:hover:border-primary/20 dark:hover:bg-primary/[0.08]"
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
                {"\u041d\u043e\u0432\u044b\u0439 \u043f\u0430\u0446\u0438\u0435\u043d\u0442"}
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={() => navigate("/appointments?new=1")}
              >
                {"\u041d\u043e\u0432\u044b\u0439 \u043f\u0440\u0438\u0435\u043c"}
              </Button>
              <Button
                className="rounded-2xl"
                onClick={() => navigate("/records?new=1")}
              >
                {"\u041d\u043e\u0432\u0430\u044f \u0437\u0430\u043f\u0438\u0441\u044c"}
              </Button>
            </div>
          </div>
        </div>

        <StatsCards items={statItems} />

        <div className="mb-6">
          <UpcomingAppointments
            appointments={upcomingAppointments}
            patients={patients}
          />
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
      </div>
    </main>
  );
}
