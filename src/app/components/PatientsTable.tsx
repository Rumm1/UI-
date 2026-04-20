import { useNavigate } from "react-router";
import { Patient } from "../types/medical";
import {
  calculateAge,
  formatCompactDate,
  patientStatusLabels,
} from "../lib/prototype";
import { StatePanel } from "./shared/StatePanel";
import { StatusBadge } from "./shared/StatusBadge";

interface PatientsTableProps {
  patients: Patient[];
}

export function PatientsTable({ patients }: PatientsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Пациенты под наблюдением</h2>
          <p className="text-[13px] text-muted-foreground">
            Последние изменения в активной базе пациентов
          </p>
        </div>
        <button
          onClick={() => navigate("/patients")}
          className="rounded-2xl px-3 py-2 text-[13px] text-primary transition-colors hover:bg-accent"
        >
          Вся база
        </button>
      </div>

      {patients.length === 0 ? (
        <StatePanel
          title="Нет пациентов в выборке"
          description="Когда база активна, здесь появятся последние карточки пациентов с быстрым переходом в профиль."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Пациент
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Возраст
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Диагноз
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Последний визит
                </th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-accent/40"
                  onClick={() => navigate(`/patients?patient=${patient.id}`)}
                >
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-[10px] bg-primary/10 text-sm font-semibold text-primary">
                        {patient.initials}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{patient.fullName}</p>
                        <p className="text-[11px] text-muted-foreground">{patient.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-[13px] text-foreground">
                    {calculateAge(patient.birthDate)}
                  </td>
                  <td className="px-3 py-4 text-[13px] text-muted-foreground">
                    {patient.diagnosis}
                  </td>
                  <td className="px-3 py-4 text-[13px] text-muted-foreground">
                    {formatCompactDate(patient.lastVisitAt)}
                  </td>
                  <td className="px-3 py-4">
                    <StatusBadge
                      label={patientStatusLabels[patient.status]}
                      status={patient.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
