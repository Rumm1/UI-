import {
  Activity,
  HeartPulse,
  ShieldPlus,
  Stethoscope,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { ProfileAvatarPreset } from "../types/medical";

export interface ProfileAvatarOption {
  value: ProfileAvatarPreset;
  label: string;
  description: string;
  icon: LucideIcon;
  className: string;
}

export const profileAvatarOptions: ProfileAvatarOption[] = [
  {
    value: "user",
    label: "Классический профиль",
    description: "Нейтральная иконка личного кабинета",
    icon: UserRound,
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-800/80 dark:text-slate-100",
  },
  {
    value: "stethoscope",
    label: "Стетоскоп",
    description: "Основной медицинский символ врача",
    icon: Stethoscope,
    className:
      "bg-sky-100 text-sky-800 dark:bg-sky-950/65 dark:text-sky-200",
  },
  {
    value: "activity",
    label: "Мониторинг",
    description: "Подходит для цифрового медицинского профиля",
    icon: Activity,
    className:
      "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/65 dark:text-cyan-200",
  },
  {
    value: "heart",
    label: "Кардиология",
    description: "Мягкий акцент на заботу и наблюдение",
    icon: HeartPulse,
    className:
      "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200",
  },
  {
    value: "shield",
    label: "Безопасность",
    description: "Строгий знак надежности и контроля",
    icon: ShieldPlus,
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  },
];

export function getProfileAvatarOption(
  value: ProfileAvatarPreset,
): ProfileAvatarOption {
  return (
    profileAvatarOptions.find((option) => option.value === value) ??
    profileAvatarOptions[0]
  );
}
