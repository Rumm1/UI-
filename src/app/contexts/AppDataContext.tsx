import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
  resetPrototypeSnapshot,
  toggleTask,
  updateAppointmentStatus,
  updatePatient as updatePatientAction,
  updatePrescription as updatePrescriptionAction,
  updateProfileSettings,
} from "../services/prototypeApi";
import {
  connectNotificationsSocket,
  createNotification,
  getNotifications,
} from "../services/notificationsService";
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
import { Notification } from "../types/notification";

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
  liveNotification: Notification | null;
  retryBootstrap: () => Promise<void>;
  dismissLiveNotification: () => void;
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

function prependNotification(
  items: Notification[],
  notification: Notification,
): Notification[] {
  return [notification, ...items.filter((item) => item.id !== notification.id)];
}

function formatReminderDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function buildReminderCandidate(snapshot: PrototypeSnapshot) {
  const now = Date.now();
  const patientIndex = new Map(snapshot.patients.map((item) => [item.id, item]));

  const appointmentCandidates = snapshot.appointments
    .filter(
      (item) => item.status === "pending" || item.status === "confirmed",
    )
    .map((appointment) => ({
      appointment,
      patient: patientIndex.get(appointment.patientId),
      startsAt: new Date(appointment.startAt).getTime(),
    }))
    .sort((left, right) => left.startsAt - right.startsAt);

  const pendingAppointment =
    appointmentCandidates.find((item) => item.appointment.status === "pending") ??
    null;

  if (pendingAppointment) {
    return {
      key: `${pendingAppointment.appointment.id}:pending`,
      title: "Требует подтверждения приём",
      body: `${
        pendingAppointment.patient?.fullName ?? "Пациент"
      }: ${formatReminderDate(
        pendingAppointment.appointment.startAt,
      )}. Подтвердите слот и проверьте карточку пациента.`,
      actionUrl: "/appointments",
      severity: "HIGH" as const,
      displayDuration: 6,
    };
  }

  const nextAppointment =
    appointmentCandidates.find((item) => item.startsAt >= now - 30 * 60 * 1000) ??
    appointmentCandidates[0] ??
    null;

  if (nextAppointment) {
    const minutesUntilStart = Math.round((nextAppointment.startsAt - now) / 60000);
    const isSoon = minutesUntilStart <= 90;

    return {
      key: `${nextAppointment.appointment.id}:confirmed`,
      title: isSoon ? "Скоро приём пациента" : "Напоминание о приёме",
      body: `${
        nextAppointment.patient?.fullName ?? "Пациент"
      }: ${formatReminderDate(nextAppointment.appointment.startAt)}, кабинет ${
        nextAppointment.appointment.room
      }.`,
      actionUrl: "/appointments",
      severity: isSoon ? ("HIGH" as const) : ("NORMAL" as const),
      displayDuration: isSoon ? 6 : 5,
    };
  }

  const nextTask = snapshot.tasks.find((item) => !item.completed);

  if (!nextTask) {
    return null;
  }

  return {
    key: `${nextTask.id}:task`,
    title: "Напоминание по рабочему списку",
    body: `${nextTask.title}. Срок: ${formatReminderDate(nextTask.dueAt)}.`,
    actionUrl: "/",
    severity: nextTask.priority === "high" ? ("HIGH" as const) : ("LOW" as const),
    displayDuration: 5,
  };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<PrototypeSnapshot>(emptySnapshot);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [liveNotification, setLiveNotification] = useState<Notification | null>(null);
  const [liveQueue, setLiveQueue] = useState<Notification[]>([]);
  const snapshotRef = useRef(snapshot);
  const lastReminderKeyRef = useRef<string | null>(null);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  const syncNotificationsFromApi = useCallback(async () => {
    const response = await getNotifications({
      page: 1,
      size: 200,
    });

    setSnapshot((current) => ({
      ...current,
      notifications: response.items,
    }));
  }, []);

  const queueLiveNotification = useCallback((notification: Notification) => {
    setLiveNotification((current) => {
      if (!current) {
        return notification;
      }

      setLiveQueue((queue) =>
        queue.some((item) => item.id === notification.id)
          ? queue
          : [...queue, notification],
      );

      return current;
    });
  }, []);

  const dismissLiveNotification = useCallback(() => {
    setLiveNotification(null);
  }, []);

  async function bootstrap() {
    setIsBootstrapping(true);
    setBootstrapError(null);

    try {
      const nextSnapshot = await loadPrototypeSnapshot();
      setSnapshot(nextSnapshot);
      lastReminderKeyRef.current = null;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось загрузить демонстрационные данные";

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

  useEffect(() => {
    if (liveNotification || liveQueue.length === 0) {
      return;
    }

    const [next, ...rest] = liveQueue;
    setLiveNotification(next);
    setLiveQueue(rest);
  }, [liveNotification, liveQueue]);

  useEffect(() => {
    const socket = connectNotificationsSocket({
      onMessage: (message) => {
        if (message.type !== "NEW_NOTIFICATION") {
          return;
        }

        const notification = message.payload;

        setSnapshot((current) => ({
          ...current,
          notifications: prependNotification(current.notifications, notification),
        }));

        const currentProfile = snapshotRef.current.profile.notifications;
        const shouldShowPopup =
          currentProfile.push &&
          (!currentProfile.criticalOnly ||
            notification.severity === "HIGH" ||
            notification.severity === "CRITICAL");

        if (shouldShowPopup) {
          queueLiveNotification(notification);
        }
      },
      onReconnect: () => {
        void syncNotificationsFromApi();
      },
    });

    return () => {
      socket.close();
    };
  }, [queueLiveNotification, syncNotificationsFromApi]);

  useEffect(() => {
    const warmupTimer = window.setTimeout(() => {
      void emitScheduledReminder();
    }, 15000);

    const interval = window.setInterval(() => {
      void emitScheduledReminder();
    }, 60000);

    return () => {
      window.clearTimeout(warmupTimer);
      window.clearInterval(interval);
    };
  }, []);

  async function emitScheduledReminder() {
    const currentSnapshot = snapshotRef.current;
    const currentSettings = currentSnapshot.profile.notifications;

    if (!currentSettings.push) {
      return;
    }

    const reminder = buildReminderCandidate(currentSnapshot);

    if (!reminder) {
      lastReminderKeyRef.current = null;
      return;
    }

    if (
      currentSettings.criticalOnly &&
      reminder.severity !== "HIGH" &&
      reminder.severity !== "CRITICAL"
    ) {
      return;
    }

    if (lastReminderKeyRef.current === reminder.key) {
      return;
    }

    lastReminderKeyRef.current = reminder.key;

    await createNotification({
      title: reminder.title,
      body: reminder.body,
      actionUrl: reminder.actionUrl,
      severity: reminder.severity,
      displayDuration: reminder.displayDuration,
    });
  }

  async function addPatient(input: NewPatientInput) {
    const patient = await createPatientAction(input);

    setSnapshot((current) => ({
      ...current,
      patients: [patient, ...current.patients],
    }));

    toast.success("Пациент сохранён", {
      description: `${patient.fullName} можно открыть в карточке и записать на приём.`,
    });

    return patient;
  }

  async function savePatient(patientId: string, updates: UpdatePatientInput) {
    const patient = await updatePatientAction(patientId, updates);

    setSnapshot((current) => ({
      ...current,
      patients: current.patients.map((item) =>
        item.id === patientId ? patient : item,
      ),
    }));

    toast.success("Изменения сохранены", {
      description: `Карточка пациента ${patient.fullName} обновлена.`,
    });

    return patient;
  }

  async function addAppointment(input: NewAppointmentInput) {
    const appointment = await createAppointmentAction(input);
    const patient = snapshotRef.current.patients.find(
      (item) => item.id === appointment.patientId,
    );

    setSnapshot((current) => ({
      ...current,
      appointments: [appointment, ...current.appointments],
    }));

    toast.success("Новая запись создана", {
      description: `${patient?.fullName ?? "Пациент"} добавлен в расписание.`,
    });

    await createNotification({
      title:
        appointment.status === "pending"
          ? "Новый приём ожидает подтверждения"
          : "Назначен новый приём",
      body: `${
        patient?.fullName ?? "Пациент"
      }: ${formatReminderDate(appointment.startAt)}, ${
        appointment.department
      }. Проверьте карточку перед визитом.`,
      actionUrl: "/appointments",
      severity: appointment.status === "pending" ? "HIGH" : "NORMAL",
      displayDuration: 5,
    });

    return appointment;
  }

  async function setAppointmentStatus(
    appointmentId: string,
    status: AppointmentStatus,
  ) {
    const appointment = await updateAppointmentStatus(appointmentId, status);
    const patient = snapshotRef.current.patients.find(
      (item) => item.id === appointment.patientId,
    );

    setSnapshot((current) => ({
      ...current,
      appointments: current.appointments.map((item) =>
        item.id === appointmentId ? appointment : item,
      ),
    }));

    toast.success("Статус обновлён", {
      description: `${patient?.fullName ?? "Пациент"}: ${describeAppointmentStatus(
        status,
      )}.`,
    });

    if (status === "confirmed" || status === "cancelled") {
      await createNotification({
        title:
          status === "cancelled" ? "Приём отменён" : "Приём подтверждён",
        body: `${patient?.fullName ?? "Пациент"}: ${describeAppointmentStatus(
          status,
        )}.`,
        actionUrl: "/appointments",
        severity: status === "cancelled" ? "HIGH" : "NORMAL",
        displayDuration: status === "cancelled" ? 6 : 4,
      });
    }

    return appointment;
  }

  async function addMedicalRecord(input: NewMedicalRecordInput) {
    const record = await createMedicalRecordAction(input);
    const patient = snapshotRef.current.patients.find(
      (item) => item.id === record.patientId,
    );

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
    }));

    toast.success("Медицинская запись создана", {
      description: `Карточка пациента ${patient?.fullName ?? ""} обновлена.`,
    });

    return record;
  }

  async function addPrescription(input: NewPrescriptionInput) {
    const prescription = await createPrescriptionAction(input);

    setSnapshot((current) => ({
      ...current,
      prescriptions: [prescription, ...current.prescriptions],
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

    setSnapshot((current) => ({
      ...current,
      prescriptions: current.prescriptions.map((item) =>
        item.id === prescriptionId ? prescription : item,
      ),
    }));

    toast.success("Назначение обновлено", {
      description: `${prescription.medication} сохранён в актуальной версии.`,
    });

    return prescription;
  }

  async function deletePrescription(prescriptionId: string) {
    const prescription = await deletePrescriptionAction(prescriptionId);

    setSnapshot((current) => ({
      ...current,
      prescriptions: current.prescriptions.filter(
        (item) => item.id !== prescriptionId,
      ),
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

    setSnapshot((current) => ({
      ...current,
      profile: nextProfile,
    }));

    if (!options?.silent) {
      toast.success("Настройки сохранены", {
        description: "Параметры профиля и рабочего графика обновлены.",
      });
    }

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
    setLiveNotification(null);
    setLiveQueue([]);
    lastReminderKeyRef.current = null;

    toast.success("Демо-данные сброшены", {
      description: "Прототип возвращён в исходное состояние.",
    });
  }

  const value: AppDataContextValue = {
    ...snapshot,
    isBootstrapping,
    bootstrapError,
    unreadCount: snapshot.notifications.filter((item) => !item.is_read).length,
    liveNotification,
    retryBootstrap: bootstrap,
    dismissLiveNotification,
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
