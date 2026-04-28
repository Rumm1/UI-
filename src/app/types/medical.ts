import { Notification } from "./notification";

export type Gender = "female" | "male";
export type PatientStatus = "active" | "follow-up" | "inactive";
export type RiskLevel = "low" | "medium" | "high";
export type AppointmentStatus =
  | "confirmed"
  | "pending"
  | "cancelled"
  | "completed";
export type RecordStatus = "final" | "draft" | "review";
export type PrescriptionStatus = "active" | "expired" | "draft";
export type DashboardPeriod = "day" | "week" | "month";
export type ThemePreference = "light" | "dark" | "system";
export type LanguagePreference = "ru" | "en";
export type InterfaceMode = "desktop" | "tablet" | "mobile";
export type ProfileAvatarPreset =
  | "user"
  | "stethoscope"
  | "activity"
  | "heart"
  | "shield";

export interface PatientMetrics {
  bloodPressure: string;
  pulse: number;
  temperature: number;
  oxygenLevel: number;
  weightKg: number;
  heightCm: number;
}

export interface Patient {
  id: string;
  fullName: string;
  initials: string;
  gender: Gender;
  birthDate: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  insurancePolicy: string;
  bloodType: string;
  status: PatientStatus;
  riskLevel: RiskLevel;
  diagnosis: string;
  allergies: string[];
  chronicConditions: string[];
  lastVisitAt: string;
  lastDoctor: string;
  emergencyContact: string;
  overview: string;
  notes: string;
  metrics: PatientMetrics;
  medicalHistory: string[];
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorName: string;
  department: string;
  room: string;
  type: string;
  startAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  notes: string;
}

export interface LabResult {
  name: string;
  status: string;
  date: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  appointmentId?: string | null;
  doctorName: string;
  specialty: string;
  createdAt: string;
  visitType: string;
  status: RecordStatus;
  complaints: string;
  examination: string;
  diagnosis: string;
  treatment: string;
  recommendations: string;
  labResults: LabResult[];
}

export interface Prescription {
  id: string;
  patientId: string;
  recordId?: string | null;
  doctorName: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  createdAt: string;
  expiresAt: string;
  status: PrescriptionStatus;
  refills: number;
}

export interface ProfileNotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  criticalOnly: boolean;
  dailyDigest: boolean;
}

export interface WorkingDay {
  id: string;
  dayKey: string;
  label: string;
  enabled: boolean;
  start: string;
  end: string;
}

export interface ProfileSettings {
  firstName: string;
  lastName: string;
  fullName: string;
  initials: string;
  avatarPreset: ProfileAvatarPreset;
  avatarImage: string | null;
  role: string;
  specialty: string;
  email: string;
  phone: string;
  clinic: string;
  licenseNumber: string;
  bio: string;
  passwordUpdatedAt: string | null;
  theme: ThemePreference;
  language: LanguagePreference;
  interfaceMode: InterfaceMode;
  timezone: string;
  notifications: ProfileNotificationSettings;
  workingHours: WorkingDay[];
}

export interface TaskItem {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  dueAt: string;
}

export interface NewTaskInput {
  title: string;
  priority: TaskItem["priority"];
  dueAt: string;
}

export interface DashboardActivityPoint {
  label: string;
  appointments: number;
  records: number;
  patients: number;
}

export interface PrototypeSnapshot {
  patients: Patient[];
  appointments: Appointment[];
  records: MedicalRecord[];
  prescriptions: Prescription[];
  profile: ProfileSettings;
  tasks: TaskItem[];
  notifications: Notification[];
}

export interface NewPatientInput {
  fullName: string;
  gender: Gender;
  birthDate: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  diagnosis: string;
  status: PatientStatus;
  notes: string;
  overview?: string;
  lastDoctor?: string;
  emergencyContact?: string;
  allergies?: string[];
  metrics?: Partial<PatientMetrics>;
}

export interface UpdatePatientInput extends Partial<NewPatientInput> {
  riskLevel?: RiskLevel;
}

export interface NewAppointmentInput {
  patientId: string;
  doctorName: string;
  department: string;
  room: string;
  type: string;
  startAt: string;
  durationMinutes: number;
  status?: AppointmentStatus;
  notes: string;
}

export interface NewMedicalRecordInput {
  patientId: string;
  appointmentId?: string | null;
  doctorName: string;
  specialty: string;
  visitType: string;
  status?: RecordStatus;
  complaints: string;
  examination: string;
  diagnosis: string;
  treatment: string;
  recommendations: string;
}

export interface NewPrescriptionInput {
  patientId: string;
  recordId?: string | null;
  doctorName: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  status?: PrescriptionStatus;
  expiresAt: string;
}

export interface UpdatePrescriptionInput extends Partial<NewPrescriptionInput> {}
