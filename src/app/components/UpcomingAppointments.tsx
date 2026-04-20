import { formatDistanceToNowStrict } from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router";
import { Appointment, Patient } from "../types/medical";
import {
  appointmentStatusLabels,
  formatDisplayDateTime,
  getPatientById,
} from "../lib/prototype";
import { StatePanel } from "./shared/StatePanel";
import { StatusBadge } from "./shared/StatusBadge";

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  patients: Patient[];
}

export function UpcomingAppointments({
  appointments,
  patients,
}: UpcomingAppointmentsProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Ближайшие приемы</h2>
          <p className="text-sm text-muted-foreground">
            Живой список следующих приемов из текущего расписания
          </p>
        </div>
        <button
          onClick={() => navigate("/appointments")}
          className="rounded-2xl px-3 py-2 text-sm text-primary transition-colors hover:bg-accent"
        >
          Открыть расписание
        </button>
      </div>

      {appointments.length === 0 ? (
        <StatePanel
          title="Нет ближайших приемов"
          description="Когда в расписании появятся новые слоты, здесь будет быстрый список ближайших визитов."
        />
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const patient = getPatientById(patients, appointment.patientId);

            if (!patient) {
              return null;
            }

            return (
              <button
                key={appointment.id}
                onClick={() =>
                  navigate(`/appointments?appointment=${appointment.id}`)
                }
                className="flex w-full items-center gap-4 rounded-2xl border border-border px-4 py-4 text-left transition-colors hover:bg-accent/50"
              >
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <span className="text-base font-semibold">
                    {new Date(appointment.startAt).getHours().toString().padStart(2, "0")}
                  </span>
                  <span className="text-xs">
                    :{new Date(appointment.startAt).getMinutes().toString().padStart(2, "0")}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="truncate font-medium text-foreground">{patient.fullName}</p>
                    <StatusBadge
                      label={appointmentStatusLabels[appointment.status]}
                      status={appointment.status}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {appointment.department} • {appointment.type}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDisplayDateTime(appointment.startAt)} • через{" "}
                    {formatDistanceToNowStrict(new Date(appointment.startAt), {
                      locale: ru,
                    })}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
