import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (value: number, minimumFractionDigits = 2) => {
  if (isNaN(value)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: minimumFractionDigits,
    maximumFractionDigits: minimumFractionDigits,
  }).format(value);
};

export const formatNumber = (value: number, minimumFractionDigits = 0, suffix = "") => {
    if (isNaN(value)) return `0${suffix}`;
    const formatted = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: minimumFractionDigits,
      maximumFractionDigits: 2,
    }).format(value);
    return `${formatted}${suffix}`;
};

    