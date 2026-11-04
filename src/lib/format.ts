const numberFormats = new Map<number, Intl.NumberFormat>()

function grouped(decimals: number): Intl.NumberFormat {
  let format = numberFormats.get(decimals)
  if (!format) {
    // en-IN gives the lakh grouping (1,25,000) used on Bangladeshi bills.
    format = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    numberFormats.set(decimals, format)
  }
  return format
}

export function formatNumber(value: number, decimals = 0): string {
  return grouped(decimals).format(value)
}

export function formatTaka(value: number, { decimals = 2 }: { decimals?: number } = {}): string {
  return `৳${formatNumber(value, decimals)}`
}

export function formatKwh(value: number): string {
  return `${formatNumber(value, 1)} kWh`
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

export function formatCompact(value: number): string {
  return compact.format(value)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatMonth(month: string, { year = false }: { year?: boolean } = {}): string {
  const [y, m] = month.split('-')
  const name = MONTHS[Number(m) - 1] ?? month
  return year ? `${name} ${y}` : name
}

export function formatDay(isoDate: string, { year = false }: { year?: boolean } = {}): string {
  const [y, m, d] = isoDate.split('-')
  const label = `${Number(d)} ${MONTHS[Number(m) - 1] ?? ''}`
  return year ? `${label} ${y}` : label
}
