import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  createAppointment as createAppointmentAction,
  createMedicalRecord as createMedicalRecordAction,
  createPatient as createPatientAction,
  createPrescription as createPrescriptionAction,
  deletePrescription as deletePrescriptionAction,
  describeAppointmentStatus,
  loadPrototypeSnapshot,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  pushNotification,
  resetPrototypeSnapshot,
  toggleTask,
  updateAppointmentStatus,
  updatePatient as updatePatientAction,
  updatePrescription as updatePrescriptionAction,
  updateProfileSettings,
} from "../services/prototypeApi";
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

const emptySnapshot: PrototypeSnapshot = {
  patients: [],
  appointments: [],
  records: [],
  prescriptions: [],
  profile: {
    firstName: "",
    lastName: "",
    fullName: "",
    initials: "",
    role: "",
    specialty: "",
    email: "",
    phone: "",
    clinic: "",
    licenseNumber: "",
    bio: "",
    theme: "light",
    language: "ru",
    interfaceMode: "desktop",
    timezone: "",
    notifications: {
      email: true,
      push: true,
      sms: false,
      criticalOnly: true,
      dailyDigest: false,
    },
    workingHours: [],
  },
  tasks: [],
  notifications: [],
};

interface AppDataContextValue extends PrototypeSnapshot {
  isBootstrapping: boolean;
  bootstrapError: string | null;
  unreadCount: number;
  retryBootstrap: () => Promise<void>;
  addPatient: (input: NewPatientInput) => Promise<Patient>;
  savePatient: (patientId: string, updates: UpdatePatientInput) => Promise<Patient>;
  addAppointment: (input: NewAppointmentInput) => Promise<Appointment>;
  setAppointmentStatus: (
    appointmentId: string,
    status: AppointmentStatus,
  ) => Promise<Appointment>;
  addMedicalRecord: (input: NewMedicalRecordInput) => Promise<MedicalRecord>;
  addPrescription: (input: NewPrescriptionInput) => Promise<Prescription>;
  savePrescription: (
    prescriptionId: string,
    updates: UpdatePrescriptionInput,
  ) => Promise<Prescription>;
  deletePrescription: (prescriptionId: string) => Promise<void>;
  saveProfile: (
    profile: ProfileSettings,
    options?: {
      silent?: boolean;
      emitNotification?: boolean;
    },
  ) => Promise<ProfileSettings>;
  toggleTaskState: (taskId: string) => Promise<TaskItem>;
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  resetDemoData: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<PrototypeSnapshot>(emptySnapshot);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  async function bootstrap() {
    setIsBootstrapping(true);
    setBootstrapError(null);

    try {
      const nextSnapshot = await loadPrototypeSnapshot();
      setSnapshot(nextSnapshot);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось загрузить демо-данные";
      setBootstrapError(message);
      toast.error("Не удалось загрузить прототип", {
        description: message,
      });
    } finally {
      setIsBootstrapping(false);
    }
  }

  useEffect(() => {
    void bootstrap();
  }, []);

  async function addPatient(input: NewPatientInput) {
    const patient = await createPatientAction(input);
    const notification = await pushNotification({
      title: "Новый пациент добавлен",
      body: `${patient.fullName} появился в базе пациентов.`,
      actionUrl: "/patients",
    });

    setSnapshot((current) => ({
      ...current,
      patients: [patient, ...current.patients],
      notifications: [notification, ...current.notifications],
    }));

    toast.success("Пациент сохранен", {
      description: `${patient.fullName} можно открыть в карточке и записать на прием.`,
    });

    return patient;
  }

  async function savePatient(patientId: string, updates: UpdatePatientInput) {
    const patient = await updatePatientAction(patientId, updates);
    const notification = await pushNotification({
      title: "Карточка пациента обновлена",
      body: `Изменения по пациенту ${patient.fullName} сохранены.`,
      actionUrl: "/patients",
    });

    setSnapshot((current) => ({
      ...current,
      patients: current.patients.map((item) =>
        item.id === patientId ? patient : item,
      ),
      notifications: [notification, ...current.notifications],
    }));

    toast.success("Изменения сохранены", {
      description: `Карточка пациента ${patient.fullName} обновлена.`,
    });

    return patient;
  }

  async function addAppointment(input: NewAppointmentInput) {
    const appointment = await createAppointmentAction(input);
    const patient = snapshot.patients.find((item) => item.id === appointment.patientId);
    const notification = await pushNotification({
      title: "Запись на прием создана",
      body: `${patient?.fullName ?? "Пациент"} добавлен в расписание.`,
      actionUrl: "/appointments",
    });

    setSnapshot((current) => ({
      ...current,
      appointments: [appointment, ...current.appointments],
      notifications: [notification, ...current.notifications],
    }));

    toast.success("Новая запись создана", {
      description: `${patient?.fullName ?? "Пациент"} добавлен в расписание.`,
    });

    return appointment;
  }

  async function setAppointmentStatus(appointmentId: string, status: AppointmentStatus) {
    const appointment = await updateAppointmentStatus(appointmentId, status);
    const patient = snapshot.patients.find((item) => item.id === appointment.patientId);
    const notification = await pushNotification({
      title: "Статус записи изменен",
      body: `${patient?.fullName ?? "Пациент"}: ${describeAppointmentStatus(status)}.`,
      actionUrl: "/appointments",
      severity: status === "cancelled" ? "HIGH" : "NORMAL",
    });

    setSnapshot((current) => ({
      ...current,
      appointments: current.appointments.map((item) =>
        item.id === appointmentId ? appointment : item,
      ),
      notifications: [notification, ...current.notifications],
    }));

    toast.success("Статус обновлен", {
      description: `${patient?.fullName ?? "Пациент"}: ${describeAppointmentStatus(status)}.`,
    });

    return appointment;
  }

  async function addMedicalRecord(input: NewMedicalRecordInput) {
    const record = await createMedicalRecordAction(input);
    const patient = snapshot.patients.find((item) => item.id === record.patientId);
    const notification = await pushNotification({
      title: "Медицинская запись сохранена",
      body: `Новая запись по пациенту ${patient?.fullName ?? ""} доступна в медкарте.`,
      actionUrl: "/records",
    });

    setSnapshot((current) => ({
      ...current,
      records: [record, ...current.records],
      patients: current.patients.map((item) =>
        item.id === record.patientId
          ? {
              ...item,
              diagnosis: record.diagnosis,
              lastVisitAt: record.createdAt,
            }
          : item,
      ),
      notifications: [notification, ...current.notifications],
    }));

    toast.success("Медицинская запись создана", {
      description: `Карточка пациента ${patient?.fullName ?? ""} обновлена.`,
    });

    return record;
  }

  async function addPrescription(input: NewPrescriptionInput) {
    const prescription = await createPrescriptionAction(input);
    const patient = snapshot.patients.find((item) => item.id === prescription.patientId);
    const notification = await pushNotification({
      title: "Назначение добавлено",
      body: `Для пациента ${patient?.fullName ?? ""} создано новое назначение.`,
      actionUrl: "/prescriptions",
    });

    setSnapshot((current) => ({
      ...current,
      prescriptions: [prescription, ...current.prescriptions],
      notifications: [notification, ...current.notifications],
    }));

    toast.success("Назначение сохранено", {
      description: `${prescription.medication} добавлен в список рецептов.`,
    });

    return prescription;
  }

  async function savePrescription(
    prescriptionId: string,
    updates: UpdatePrescriptionInput,
  ) {
    const prescription = await updatePrescriptionAction(prescriptionId, updates);
    const patient = snapshot.patients.find((item) => item.id === prescription.patientId);
    const notification = await pushNotification({
      title: "Назначение обновлено",
      body: `Изменения по препарату ${prescription.medication} для ${patient?.fullName ?? "пациента"} сохранены.`,
      actionUrl: "/prescriptions",
    });

    setSnapshot((current) => ({
      ...current,
      prescriptions: current.prescriptions.map((item) =>
        item.id === prescriptionId ? prescription : item,
      ),
      notifications: [notification, ...current.notifications],
    }));

    toast.success("Назначение обновлено", {
      description: `${prescription.medication} сохранен в актуальной версии.`,
    });

    return prescription;
  }

  async function deletePrescription(prescriptionId: string) {
    const prescription = await deletePrescriptionAction(prescriptionId);
    const patient = snapshot.patients.find((item) => item.id === prescription.patientId);
    const notification = await pushNotification({
      title: "Назначение удалено",
      body: `Назначение ${prescription.medication} для ${patient?.fullName ?? "пациента"} удалено из демо-прототипа.`,
      actionUrl: "/prescriptions",
      severity: "NORMAL",
    });

    setSnapshot((current) => ({
      ...current,
      prescriptions: current.prescriptions.filter((item) => item.id !== prescriptionId),
      notifications: [notification, ...current.notifications],
    }));

    toast.success("Назначение удалено", {
      description: `${prescription.medication} больше не отображается в списке.`,
    });
  }

  async function saveProfile(
    profile: ProfileSettings,
    options?: {
      silent?: boolean;
      emitNotification?: boolean;
    },
  ) {
    const nextProfile = await updateProfileSettings(profile);
    const notification = await pushNotification({
      title: "Настройки профиля сохранены",
      body: "Изменения профиля и уведомлений применены в демо-прототипе.",
      actionUrl: "/settings",
    });

    setSnapshot((current) => ({
      ...current,
      profile: nextProfile,
      notifications: [notification, ...current.notifications],
    }));

    toast.success("Настройки сохранены", {
      description: "Параметры профиля обновлены.",
    });

    return nextProfile;
  }

  async function toggleTaskState(taskId: string) {
    const nextTask = await toggleTask(taskId);
    setSnapshot((current) => ({
      ...current,
      tasks: current.tasks.map((item) => (item.id === taskId ? nextTask : item)),
    }));
    return nextTask;
  }

  async function markNotificationRead(notificationId: string) {
    await markNotificationAsRead(notificationId);
    setSnapshot((current) => ({
      ...current,
      notifications: current.notifications.map((item) =>
        item.id === notificationId ? { ...item, is_read: true } : item,
      ),
    }));
  }

  async function markAllRead() {
    await markAllNotificationsAsRead();
    setSnapshot((current) => ({
      ...current,
      notifications: current.notifications.map((item) => ({
        ...item,
        is_read: true,
      })),
    }));
  }

  async function resetDemoData() {
    const nextSnapshot = await resetPrototypeSnapshot();
    setSnapshot(nextSnapshot);
    toast.success("Демо-данные сброшены", {
      description: "Прототип возвращен в исходное состояние.",
    });
  }

  const value: AppDataContextValue = {
    ...snapshot,
    isBootstrapping,
    bootstrapError,
    unreadCount: snapshot.notifications.filter((item) => !item.is_read).length,
    retryBootstrap: bootstrap,
    addPatient,
    savePatient,
    addAppointment,
    setAppointmentStatus,
    addMedicalRecord,
    addPrescription,
    savePrescription,
    deletePrescription,
    saveProfile,
    toggleTaskState,
    markNotificationRead,
    markAllRead,
    resetDemoData,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }

  return context;
}
