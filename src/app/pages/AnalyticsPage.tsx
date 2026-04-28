import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, Users, Calendar, Activity } from "lucide-react";

const monthlyData = [
  { month: "Янв", appointments: 145, patients: 187, revenue: 420 },
  { month: "Фев", appointments: 158, patients: 203, revenue: 465 },
  { month: "Мар", appointments: 172, patients: 221, revenue: 510 },
  { month: "Апр", appointments: 168, patients: 215, revenue: 495 },
  { month: "Май", appointments: 185, patients: 238, revenue: 548 },
  { month: "Июн", appointments: 192, patients: 247, revenue: 572 },
];

const diagnosisData = [
  { name: "Гипертония", value: 145, color: "#7faab1" },
  { name: "Диабет", value: 98, color: "#6c959d" },
  { name: "Аллергии", value: 87, color: "#597d85" },
  { name: "Гастрит", value: 76, color: "#97bcc2" },
  { name: "Прочие", value: 234, color: "#b4d0d4" },
];

const ageDistribution = [
  { age: "0-18", count: 45 },
  { age: "19-30", count: 98 },
  { age: "31-45", count: 187 },
  { age: "46-60", count: 156 },
  { age: "61+", count: 154 },
];

const doctorStats = [
  { doctor: "Иванов И.И.", appointments: 187, patients: 234, rating: 4.8 },
  { doctor: "Петрова М.А.", appointments: 165, patients: 198, rating: 4.9 },
  { doctor: "Сидоров А.В.", appointments: 143, patients: 176, rating: 4.7 },
  { doctor: "Козлова Е.П.", appointments: 128, patients: 152, rating: 4.6 },
];

const kpis = [
  {
    label: "Всего пациентов",
    value: "1,247",
    change: "+12.5%",
    trend: "up",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10 dark:bg-primary/15",
  },
  {
    label: "Записи в месяц",
    value: "192",
    change: "+8.2%",
    trend: "up",
    icon: Calendar,
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-100 dark:bg-emerald-500/15",
  },
  {
    label: "Средняя загрузка",
    value: "87%",
    change: "+3.1%",
    trend: "up",
    icon: Activity,
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-100 dark:bg-amber-500/15",
  },
  {
    label: "Рост за год",
    value: "+24%",
    change: "vs прошлый год",
    trend: "up",
    icon: TrendingUp,
    color: "text-slate-700 dark:text-slate-200",
    bgColor: "bg-slate-100 dark:bg-slate-500/15",
  },
];

export function AnalyticsPage() {
  return (
    <main className="flex-1 overflow-auto">
      <div className="p-6 max-w-[1440px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            Аналитика
          </h1>
          <p className="text-sm text-muted-foreground">
            Статистика и показатели эффективности
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map((kpi, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{kpi.label}</span>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-3xl font-semibold text-foreground mb-1">
                {kpi.value}
              </p>
              <p className="text-xs text-green-600">{kpi.change}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Динамика зап��сей и пациентов
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Помесячная статистика за последние 6 месяцев
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4f4f2" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#5a7a79", fontSize: 12 }}
                  axisLine={{ stroke: "#d4f4f2" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#5a7a79", fontSize: 12 }}
                  axisLine={{ stroke: "#d4f4f2" }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #d4f4f2",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="appointments"
                  stroke="#40E0D0"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Записи"
                />
                <Line
                  type="monotone"
                  dataKey="patients"
                  stroke="#36c9ba"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Пациенты"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Распределение диагнозов
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Топ-5 наиболее частых диагнозов
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={diagnosisData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {diagnosisData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #d4f4f2",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Возрастное распределение пациентов
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Количество пациентов по возрастным группам
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4f4f2" vertical={false} />
                <XAxis
                  dataKey="age"
                  tick={{ fill: "#5a7a79", fontSize: 12 }}
                  axisLine={{ stroke: "#d4f4f2" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#5a7a79", fontSize: 12 }}
                  axisLine={{ stroke: "#d4f4f2" }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #d4f4f2",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "rgba(64, 224, 208, 0.05)" }}
                />
                <Bar dataKey="count" fill="#40E0D0" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Статистика врачей
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Показатели эффективности специалистов
            </p>
            <div className="space-y-4">
              {doctorStats.map((doctor, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {doctor.doctor.split(" ")[0].charAt(0)}
                          {doctor.doctor.split(" ")[1].charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {doctor.doctor}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-yellow-600">★</span>
                          <span className="text-xs text-muted-foreground">
                            {doctor.rating}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Записи
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {doctor.appointments}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Пациенты
                      </p>
                      <p className="text-lg font-semibold text-foreground">
                        {doctor.patients}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
