import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { TaskItem } from "../types/medical";
import { StatePanel } from "./shared/StatePanel";

interface TasksListProps {
  tasks: TaskItem[];
  onToggle: (taskId: string) => void;
}

const priorityClasses: Record<TaskItem["priority"], string> = {
  high: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200",
  low: "bg-slate-100 text-slate-600 dark:bg-slate-900/35 dark:text-slate-200",
};

const priorityLabels: Record<TaskItem["priority"], string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
};

export function TasksList({ tasks, onToggle }: TasksListProps) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-foreground">Операционные задачи</h2>
        <p className="text-[13px] text-muted-foreground">
          Небольшая интерактивная лента задач для ощущения реального рабочего стола
        </p>
      </div>

      {tasks.length === 0 ? (
        <StatePanel
          title="Нет активных задач"
          description="Когда в операционном контуре появятся новые задачи, они будут собраны в этой ленте."
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => onToggle(task.id)}
              className="flex w-full items-start gap-3 rounded-2xl border border-border p-4 text-left transition-colors hover:bg-accent/50"
            >
              <span
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                  task.completed
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
                }`}
              >
                {task.completed ? "✓" : ""}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[13px] ${
                    task.completed
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                >
                  {task.title}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${priorityClasses[task.priority]}`}
                  >
                    {priorityLabels[task.priority]}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(task.dueAt), {
                      addSuffix: true,
                      locale: ru,
                    })}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
