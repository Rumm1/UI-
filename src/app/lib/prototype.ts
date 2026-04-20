import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ru } from "date-fns/locale";
import {
  Appointment,
  AppointmentStatus,
  DashboardPeriod,
  MedicalRecord,
  Patient,
  PatientStatus,
  PrescriptionStatus,
  RecordStatus,
} from "../types/medical";

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function calculateAge(birthDate: string, baseDate = new Date()) {
  const birth = new Date(birthDate);
  let age = baseDate.getFullYear() - birth.getFullYear();
  const monthDiff = baseDate.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && baseDate.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return age;
}

export function formatDisplayDate(value: string, pattern = "dd MMM yyyy") {
  return format(new Date(value), pattern, { locale: ru });
}

export function formatCompactDate(value: string) {
  return formatDisplayDate(value, "dd.MM.yyyy");
}

export function formatDisplayDateTime(value: string) {
  return formatDisplayDate(value, "dd MMM yyyy, HH:mm");
}

export function formatDisplayTime(value: string) {
  return formatDisplayDate(value, "HH:mm");
}

export function getPeriodRange(period: DashboardPeriod, referenceDate: Date) {
  switch (period) {
    case "day":
      return {
        start: startOfDay(referenceDate),
        end: endOfDay(referenceDate),
      };
    case "week":
      return {
        start: startOfWeek(referenceDate, { weekStartsOn: 1 }),
        end: endOfWeek(referenceDate, { weekStartsOn: 1 }),
      };
    case "month":
      return {
        start: startOfMonth(referenceDate),
        end: endOfMonth(referenceDate),
      };
  }
}

export function getPeriodLabel(period: DashboardPeriod, referenceDate: Date) {
  const { start, end } = getPeriodRange(period, referenceDate);

  if (period === "day") {
    return formatDisplayDate(start.toISOString(), "dd MMMM yyyy");
  }

  return `${format(start, "dd MMM", { locale: ru })} - ${format(end, "dd MMM", {
    locale: ru,
  })}`;
}

export const patientStatusLabels: Record<PatientStatus, string> = {
  active: "Активен",
  "follow-up": "Нужен контроль",
  inactive: "Неактивен",
};

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  confirmed: "Подтверждена",
  pending: "Ожидает",
  cancelled: "Отменена",
  completed: "Завершена",
};

export const recordStatusLabels: Record<RecordStatus, string> = {
  final: "Закрыта",
  draft: "Черновик",
  review: "На проверке",
};

export const prescriptionStatusLabels: Record<PrescriptionStatus, string> = {
  active: "Активен",
  expired: "Истек",
  draft: "Черновик",
};

const statusToneMap: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "follow-up": "border-amber-200 bg-amber-50 text-amber-700",
  inactive: "border-slate-200 bg-slate-100 text-slate-600",
  confirmed: "border-cyan-200 bg-cyan-50 text-cyan-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  final: "border-emerald-200 bg-emerald-50 text-emerald-700",
  draft: "border-slate-200 bg-slate-100 text-slate-600",
  review: "border-violet-200 bg-violet-50 text-violet-700",
  expired: "border-slate-200 bg-slate-100 text-slate-600",
};

export function getStatusTone(status: string) {
  return statusToneMap[status] ?? "border-border bg-muted text-muted-foreground";
}

export function getPatientNextAppointment(
  patientId: string,
  appointments: Appointment[],
) {
  const now = Date.now();

  return appointments
    .filter(
      (appointment) =>
        appointment.patientId === patientId &&
        appointment.status !== "cancelled" &&
        new Date(appointment.startAt).getTime() >= now,
    )
    .sort(
      (left, right) =>
        new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
    )[0];
}

export function getPatientLastRecord(
  patientId: string,
  records: MedicalRecord[],
) {
  return records
    .filter((record) => record.patientId === patientId)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )[0];
}

export function getPatientById(patients: Patient[], patientId: string) {
  return patients.find((patient) => patient.id === patientId);
}
