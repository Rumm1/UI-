import { useMemo, useState, type FormEvent } from "react";
import { addHours, formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Check, Plus, Trash2 } from "lucide-react";
import { NewTaskInput, TaskItem } from "../types/medical";
import { StatePanel } from "./shared/StatePanel";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface TasksListProps {
  tasks: TaskItem[];
  onCreate: (input: NewTaskInput) => Promise<unknown> | unknown;
  onToggle: (taskId: string) => Promise<unknown> | unknown;
  onDelete: (taskId: string) => Promise<unknown> | unknown;
}

type TaskFilter = "all" | "open" | "completed";

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

const filterLabels: Record<TaskFilter, string> = {
  all: "Все",
  open: "Открытые",
  completed: "Готово",
};

function toDateTimeLocalValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getDueAtPreset(hoursFromNow: number) {
  return toDateTimeLocalValue(addHours(new Date(), hoursFromNow));
}

function createTaskDraft() {
  return {
    title: "",
    priority: "medium" as TaskItem["priority"],
    dueAt: getDueAtPreset(24),
  };
}

export function TasksList({
  tasks,
  onCreate,
  onToggle,
  onDelete,
}: TasksListProps) {
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [showComposer, setShowComposer] = useState(false);
  const [draft, setDraft] = useState(createTaskDraft);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const openCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.length - openCount;

  const visibleTasks = useMemo(() => {
    const sortedTasks = [...tasks].sort((left, right) => {
      if (left.completed !== right.completed) {
        return Number(left.completed) - Number(right.completed);
      }

      return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
    });

    if (filter === "open") {
      return sortedTasks.filter((task) => !task.completed);
    }

    if (filter === "completed") {
      return sortedTasks.filter((task) => task.completed);
    }

    return sortedTasks;
  }, [filter, tasks]);

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = draft.title.trim();

    if (!title) {
      setError("Введите название задачи.");
      return;
    }

    if (title.length < 4) {
      setError("Сделайте формулировку чуть подробнее, минимум 4 символа.");
      return;
    }

    const dueAt = new Date(draft.dueAt);

    if (Number.isNaN(dueAt.getTime())) {
      setError("Укажите корректный срок задачи.");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      await Promise.resolve(
        onCreate({
          title,
          priority: draft.priority,
          dueAt: dueAt.toISOString(),
        }),
      );
      setDraft(createTaskDraft());
      setShowComposer(false);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleTask(taskId: string) {
    setTogglingTaskId(taskId);

    try {
      await Promise.resolve(onToggle(taskId));
    } finally {
      setTogglingTaskId(null);
    }
  }

  async function handleDeleteTask(taskId: string) {
    setDeletingTaskId(taskId);

    try {
      await Promise.resolve(onDelete(taskId));
    } finally {
      setDeletingTaskId(null);
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Операционные задачи</h2>
          <p className="text-[13px] text-muted-foreground">
            Рабочая лента задач с быстрым добавлением, фильтрацией и отметкой статуса
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="rounded-[12px]"
          onClick={() => {
            setShowComposer((current) => !current);
            setError(null);
          }}
        >
          <Plus className="size-4" />
          {showComposer ? "Скрыть" : "Новая задача"}
        </Button>
      </div>

      {showComposer ? (
        <form
          onSubmit={handleCreateTask}
          className="mb-5 rounded-[24px] border border-primary/15 bg-primary/[0.04] p-4"
        >
          <div className="grid gap-4">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-primary">
                Быстрое добавление
              </p>
              <Input
                value={draft.title}
                placeholder="Например: Перезвонить пациенту после результатов анализа"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Приоритет
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  Object.keys(priorityLabels) as Array<TaskItem["priority"]>
                ).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        priority,
                      }))
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      draft.priority === priority
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {priorityLabels[priority]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Срок
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Сегодня", hours: 4 },
                    { label: "Завтра", hours: 24 },
                    { label: "3 дня", hours: 72 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          dueAt: getDueAtPreset(preset.hours),
                        }))
                      }
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                type="datetime-local"
                value={draft.dueAt}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    dueAt: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-[14px] border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px]"
              onClick={() => {
                setDraft(createTaskDraft());
                setShowComposer(false);
                setError(null);
              }}
            >
              Отмена
            </Button>
            <Button
              type="submit"
              className="rounded-[12px]"
              disabled={isCreating}
            >
              {isCreating ? "Добавляем..." : "Добавить задачу"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(filterLabels) as TaskFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === item
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {filterLabels[item]}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {openCount} открыто, {completedCount} выполнено
        </p>
      </div>

      {tasks.length === 0 ? (
        <StatePanel
          title="Список задач пока пуст"
          description="Добавьте первую задачу через форму выше, чтобы рабочая лента стала живой."
        />
      ) : visibleTasks.length === 0 ? (
        <StatePanel
          title="В этом фильтре пока ничего нет"
          description="Смените вкладку или добавьте новую задачу в рабочий список."
        />
      ) : (
        <div className="space-y-3">
          {visibleTasks.map((task) => {
            const isToggling = togglingTaskId === task.id;
            const isDeleting = deletingTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  task.completed
                    ? "border-border/70 bg-muted/25"
                    : "border-border bg-background hover:bg-accent/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      void handleToggleTask(task.id);
                    }}
                    disabled={isToggling || isDeleting}
                    className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      task.completed
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-transparent hover:border-primary/40"
                    }`}
                    aria-label={
                      task.completed
                        ? "Вернуть задачу в работу"
                        : "Отметить задачу выполненной"
                    }
                  >
                    <Check className="size-3.5" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p
                          className={`text-[13px] leading-6 ${
                            task.completed
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-1 text-[11px] font-semibold ${priorityClasses[task.priority]}`}
                          >
                            {priorityLabels[task.priority]}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Срок {formatDistanceToNow(new Date(task.dueAt), {
                              addSuffix: true,
                              locale: ru,
                            })}
                          </span>
                          {task.completed ? (
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
                              Выполнено
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={task.completed ? "outline" : "secondary"}
                          className="rounded-[12px]"
                          disabled={isToggling || isDeleting}
                          onClick={() => {
                            void handleToggleTask(task.id);
                          }}
                        >
                          {isToggling
                            ? "Обновляем..."
                            : task.completed
                              ? "Вернуть"
                              : "Готово"}
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="rounded-[12px] text-muted-foreground hover:text-destructive"
                          disabled={isDeleting || isToggling}
                          onClick={() => {
                            void handleDeleteTask(task.id);
                          }}
                          aria-label="Удалить задачу"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
