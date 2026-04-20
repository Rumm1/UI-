import { buildPrototypeSnapshot } from "../mock/prototypeData";
import { appointmentStatusLabels, createId, getInitials } from "../lib/prototype";
import {
  Appointment,
  AppointmentStatus,
  MedicalRecord,
  NewAppointmentInput,
  NewMedicalRecordInput,
  NewPatientInput,
  NewPrescriptionInput,
  Patient,
  Prescription,
  ProfileSettings,
  PrototypeSnapshot,
  TaskItem,
  UpdatePrescriptionInput,
  UpdatePatientInput,
} from "../types/medical";
import { Notification, NotificationSeverity } from "../types/notification";

const STORAGE_KEY = "medsystem-demo-prototype-v1";

function buildDefaultSnapshot() {
  return structuredClone(buildPrototypeSnapshot());
}

function readStoredSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as PrototypeSnapshot;
  } catch (error) {
    console.error("Failed to read prototype snapshot", error);
    return null;
  }
}

function persistDatabase() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
}

const initialSnapshot = readStoredSnapshot();

let database: PrototypeSnapshot = initialSnapshot ?? buildDefaultSnapshot();

if (!initialSnapshot) {
  persistDatabase();
}

function cloneValue<T>(value: T) {
  return structuredClone(value);
}

function delay<T>(value: T, timeout = 350) {
  return new Promise<T>((resolve) => {
    window.setTimeout(() => resolve(cloneValue(value)), timeout);
  });
}

function getPatient(patientId: string) {
  const patient = database.patients.find((item) => item.id === patientId);

  if (!patient) {
    throw new Error("Patient not found");
  }

  return patient;
}

export async function loadPrototypeSnapshot() {
  database = readStoredSnapshot() ?? buildDefaultSnapshot();
  persistDatabase();
  return delay(database, 650);
}

export async function createPatient(input: NewPatientInput) {
  const defaultMetrics = {
    bloodPressure: "120/80",
    pulse: 72,
    temperature: 36.6,
    oxygenLevel: 98,
    weightKg: 70,
    heightCm: 170,
  };

  const patient: Patient = {
    id: createId("patient"),
    fullName: input.fullName,
    initials: getInitials(input.fullName),
    gender: input.gender,
    birthDate: input.birthDate,
    phone: input.phone,
    email: input.email,
    city: input.city,
    address: input.address,
    insurancePolicy: "ОМС будет добавлен после верификации",
    bloodType: "Не указана",
    status: input.status,
    riskLevel: "medium",
    diagnosis: input.diagnosis,
    allergies: input.allergies ?? [],
    chronicConditions: input.diagnosis ? [input.diagnosis] : [],
    lastVisitAt: new Date().toISOString(),
    lastDoctor: input.lastDoctor ?? database.profile.fullName,
    emergencyContact: input.emergencyContact ?? "Контакт будет добавлен позже",
    overview: input.overview ?? "Новый пациент зарегистрирован в демонстрационном режиме.",
    notes: input.notes,
    metrics: {
      ...defaultMetrics,
      ...input.metrics,
    },
    medicalHistory: ["Профиль пациента создан из демо-формы регистрации."],
  };

  database.patients = [patient, ...database.patients];
  persistDatabase();
  return delay(patient, 450);
}

export async function updatePatient(patientId: string, updates: UpdatePatientInput) {
  const patient = getPatient(patientId);
  const fullName = updates.fullName ?? patient.fullName;
  const nextPatient: Patient = {
    ...patient,
    ...updates,
    allergies: updates.allergies ?? patient.allergies,
    metrics: updates.metrics
      ? {
          ...patient.metrics,
          ...updates.metrics,
        }
      : patient.metrics,
    fullName,
    initials: getInitials(fullName),
  };

  database.patients = database.patients.map((item) =>
    item.id === patientId ? nextPatient : item,
  );
  persistDatabase();

  return delay(nextPatient, 350);
}

export async function createAppointment(input: NewAppointmentInput) {
  getPatient(input.patientId);

  const appointment: Appointment = {
    id: createId("appointment"),
    patientId: input.patientId,
    doctorName: input.doctorName,
    department: input.department,
    room: input.room,
    type: input.type,
    startAt: input.startAt,
    durationMinutes: input.durationMinutes,
    status: input.status ?? "pending",
    notes: input.notes,
  };

  database.appointments = [appointment, ...database.appointments];
  persistDatabase();
  return delay(appointment, 420);
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
) {
  const appointment = database.appointments.find((item) => item.id === appointmentId);

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const nextAppointment: Appointment = {
    ...appointment,
    status,
  };

  database.appointments = database.appointments.map((item) =>
    item.id === appointmentId ? nextAppointment : item,
  );
  persistDatabase();

  return delay(nextAppointment, 250);
}

export async function createMedicalRecord(input: NewMedicalRecordInput) {
  const patient = getPatient(input.patientId);
  const record: MedicalRecord = {
    id: createId("record"),
    patientId: input.patientId,
    appointmentId: input.appointmentId ?? null,
    doctorName: input.doctorName,
    specialty: input.specialty,
    createdAt: new Date().toISOString(),
    visitType: input.visitType,
    status: input.status ?? "draft",
    complaints: input.complaints,
    examination: input.examination,
    diagnosis: input.diagnosis,
    treatment: input.treatment,
    recommendations: input.recommendations,
    labResults: [],
  };

  database.records = [record, ...database.records];
  database.patients = database.patients.map((item) =>
    item.id === patient.id
      ? {
          ...item,
          diagnosis: input.diagnosis,
          lastVisitAt: record.createdAt,
          lastDoctor: input.doctorName,
        }
      : item,
  );
  persistDatabase();

  return delay(record, 430);
}

export async function createPrescription(input: NewPrescriptionInput) {
  getPatient(input.patientId);

  const prescription: Prescription = {
    id: createId("rx"),
    patientId: input.patientId,
    recordId: input.recordId ?? null,
    doctorName: input.doctorName,
    medication: input.medication,
    dosage: input.dosage,
    frequency: input.frequency,
    duration: input.duration,
    instructions: input.instructions,
    createdAt: new Date().toISOString(),
    expiresAt: input.expiresAt,
    status: input.status ?? "draft",
    refills: 0,
  };

  database.prescriptions = [prescription, ...database.prescriptions];
  persistDatabase();
  return delay(prescription, 420);
}

export async function updatePrescription(
  prescriptionId: string,
  updates: UpdatePrescriptionInput,
) {
  const prescription = database.prescriptions.find((item) => item.id === prescriptionId);

  if (!prescription) {
    throw new Error("Prescription not found");
  }

  const patientId = updates.patientId ?? prescription.patientId;
  getPatient(patientId);

  const nextPrescription: Prescription = {
    ...prescription,
    ...updates,
    patientId,
  };

  database.prescriptions = database.prescriptions.map((item) =>
    item.id === prescriptionId ? nextPrescription : item,
  );
  persistDatabase();

  return delay(nextPrescription, 320);
}

export async function deletePrescription(prescriptionId: string) {
  const prescription = database.prescriptions.find((item) => item.id === prescriptionId);

  if (!prescription) {
    throw new Error("Prescription not found");
  }

  database.prescriptions = database.prescriptions.filter(
    (item) => item.id !== prescriptionId,
  );
  persistDatabase();

  return delay(prescription, 220);
}

export async function updateProfileSettings(profile: ProfileSettings) {
  database.profile = cloneValue(profile);
  persistDatabase();
  return delay(database.profile, 380);
}

export async function toggleTask(taskId: string) {
  const task = database.tasks.find((item) => item.id === taskId);

  if (!task) {
    throw new Error("Task not found");
  }

  const nextTask: TaskItem = {
    ...task,
    completed: !task.completed,
  };

  database.tasks = database.tasks.map((item) =>
    item.id === taskId ? nextTask : item,
  );
  persistDatabase();

  return delay(nextTask, 180);
}

export async function pushNotification(input: {
  title: string;
  body: string;
  actionUrl: string;
  severity?: NotificationSeverity;
}) {
  const notification: Notification = {
    id: createId("notice"),
    title: input.title,
    body: input.body,
    action_url: input.actionUrl,
    severity: input.severity ?? "NORMAL",
    display_duration: 4,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  database.notifications = [notification, ...database.notifications];
  persistDatabase();
  return delay(notification, 120);
}

export async function markNotificationAsRead(notificationId: string) {
  database.notifications = database.notifications.map((item) =>
    item.id === notificationId ? { ...item, is_read: true } : item,
  );
  persistDatabase();

  const notification = database.notifications.find((item) => item.id === notificationId);
  return delay(notification ?? null, 100);
}

export async function markAllNotificationsAsRead() {
  database.notifications = database.notifications.map((item) => ({
    ...item,
    is_read: true,
  }));
  persistDatabase();

  return delay(database.notifications, 120);
}

export async function resetPrototypeSnapshot() {
  database = buildDefaultSnapshot();
  persistDatabase();
  return delay(database, 240);
}

export function describeAppointmentStatus(status: AppointmentStatus) {
  return appointmentStatusLabels[status];
}
