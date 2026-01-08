import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea una fecha y hora en formato 24 horas (00:00 - 23:59)
 */
export function formatDateTime24h(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const dateStr = d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  // Forzar formato 24 horas manualmente
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  
  return `${dateStr}, ${timeStr}`;
}

