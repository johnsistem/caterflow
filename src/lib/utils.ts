import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Rounds a number to a specified number of decimal places using the
 * "multiply and divide" method with an epsilon correction to avoid
 * common floating point errors (e.g., 1.005 -> 1.01).
 */
export function roundTo(value: number, decimals: number): number {
  if (isNaN(value)) return 0;
  const factor = Math.pow(10, decimals);
  // Adding Number.EPSILON ensures that numbers like 1.005 round up correctly to 1.01
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function formatCurrency(amount: number, currency: string = 'USD') {
  const symbols: Record<string, string> = {
    USD: '$', NIO: 'C$', MXN: '$', EUR: '€', COP: '$',
    CRC: '₡', GTQ: 'Q', HNL: 'L', PAB: 'B/.', PEN: 'S/',
    CLP: '$', ARS: '$', BRL: 'R$'
  };
  
  const symbol = symbols[currency] || '$';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
