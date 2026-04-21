import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from "react-router";
import { Toaster, toast } from "sonner";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { NotificationToast } from "./components/NotificationToast";
import { AppDataProvider, useAppData } from "./contexts/AppDataContext";
import { Skeleton } from "./components/ui/skeleton";

type LayoutMode = "mobile" | "tablet" | "desktop";

const DashboardContent = lazy(() =>
  import("./components/DashboardContent").then((module) => ({
    default: module.DashboardContent,
  })),
);
const PatientsPage = lazy(() =>
  import("./pages/PatientsPage").then((module) => ({
    default: module.PatientsPage,
  })),
);
const AppointmentsPage = lazy(() =>
  import("./pages/AppointmentsPage").then((module) => ({
    default: module.AppointmentsPage,
  })),
);
const MedicalRecordsPage = lazy(() =>
  import("./pages/MedicalRecordsPage").then((module) => ({
    default: module.MedicalRecordsPage,
  })),
);
const MedicalRecordDetailPage = lazy(() =>
  import("./pages/MedicalRecordDetailPage").then((module) => ({
    default: module.MedicalRecordDetailPage,
  })),
);
const PrescriptionsPage = lazy(() =>
  import("./pages/PrescriptionsPage").then((module) => ({
    default: module.PrescriptionsPage,
  })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  })),
);
const NotificationsPage = lazy(() =>
  import("./pages/NotificationsPage").then((module) => ({
    default: module.NotificationsPage,
  })),
);
const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;

function getLayoutMode(): LayoutMode {
  if (typeof window === "undefined") {
    return "desktop";
  }

  if (window.innerWidth < 768) {
    return "mobile";
  }

  if (window.innerWidth < 1200) {
    return "tablet";
  }

  return "desktop";
}

function RouteFallback() {
  return (
    <main className="flex-1 min-h-0 overflow-auto">
      <div className="mx-auto max-w-[1440px] p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-xl" />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Skeleton className="h-[520px] rounded-3xl" />
          <Skeleton className="h-[520px] rounded-3xl" />
        </div>
      </div>
    </main>
  );
}

function AppShell() {
  const {
    dismissLiveNotification,
    liveNotification,
    markNotificationRead,
    profile,
  } = useAppData();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(getLayoutMode);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getLayoutMode() !== "desktop");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      setLayoutMode(getLayoutMode());
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    setSidebarCollapsed(layoutMode !== "desktop");

    if (layoutMode !== "mobile") {
      setMobileSidebarOpen(false);
    }
  }, [layoutMode]);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function applyThemePreference() {
      const shouldUseDark =
        profile.theme === "dark" ||
        (profile.theme === "system" && media.matches);

      root.classList.toggle("dark", shouldUseDark);
    }

    root.lang = profile.language === "en" ? "en" : "ru";
    root.dataset.interfaceMode = layoutMode;
    applyThemePreference();

    if (profile.theme !== "system") {
      return () => {
        delete root.dataset.interfaceMode;
      };
    }

    media.addEventListener("change", applyThemePreference);

    return () => {
      media.removeEventListener("change", applyThemePreference);
      delete root.dataset.interfaceMode;
    };
  }, [layoutMode, profile.language, profile.theme]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement | null;

      if (target?.closest("[data-sonner-toaster]")) {
        return;
      }

      toast.dismiss();
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <>
      <Router>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <Sidebar
            collapsed={sidebarCollapsed}
            layoutMode={layoutMode}
            mobileOpen={mobileSidebarOpen}
            onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <Header
              layoutMode={layoutMode}
              onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<DashboardContent />} />
                <Route path="/patients" element={<PatientsPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/records" element={<MedicalRecordsPage />} />
                <Route path="/records/:recordId" element={<MedicalRecordDetailPage />} />
                <Route path="/prescriptions" element={<PrescriptionsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </Router>
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className: "rounded-2xl border border-border",
        }}
      />
      {liveNotification ? (
        <NotificationToast
          notification={liveNotification}
          onRead={markNotificationRead}
          onDismiss={dismissLiveNotification}
        />
      ) : null}
    </>
  );
}

export default function App() {
  return (
    <AppDataProvider>
      <AppShell />
    </AppDataProvider>
  );
}
