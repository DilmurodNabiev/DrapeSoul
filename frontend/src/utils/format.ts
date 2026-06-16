export function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  const rounded = Math.round(num)
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rounded)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}
