import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  return 'RM ' + Number(amount).toFixed(2);
}

export function formatMinutesAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m ago` : `${h}h ago`;
}

export function generateOrderNumber(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `#A-0${num}`;
}
