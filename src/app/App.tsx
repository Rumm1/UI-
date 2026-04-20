import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { AppDataProvider, useAppData } from "./contexts/AppDataContext";
import { Skeleton } from "./components/ui/skeleton";

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

function RouteFallback() {
  return (
    <main className="flex-1 overflow-auto">
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { profile } = useAppData();

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
    applyThemePreference();

    if (profile.theme !== "system") {
      return;
    }

    media.addEventListener("change", applyThemePreference);

    return () => {
      media.removeEventListener("change", applyThemePreference);
    };
  }, [profile.language, profile.theme]);

  return (
    <>
      <Router>
        <div className="flex size-full bg-background">
          <Sidebar collapsed={sidebarCollapsed} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Header
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
            />
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<DashboardContent />} />
                <Route path="/patients" element={<PatientsPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/records" element={<MedicalRecordsPage />} />
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
