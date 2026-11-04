/** The two DESCO backends. An account is served by exactly one of them. */
export type Backend = 'unified' | 'tkdes'

export interface ApiEnvelope<T> {
  code: number
  desc: string
  data: T | null
}

export interface BalanceRecord {
  accountNo: string
  meterNo: string
  balance: number
  /** Taka spent so far this calendar month. */
  currentMonthConsumption: number
  /** `YYYY-MM-DD HH:mm:ss`, Dhaka time. */
  readingTime: string
}

export interface DailyRecord {
  date: string
  /** Cumulative meter register in kWh (not a per-day value). */
  consumedUnit: number
  /** Month-to-date cost in taka; resets on the 1st. */
  consumedTaka: number
}

export interface MonthlyRecord {
  month: string
  consumedUnit: number
  consumedTaka: number
  maximumDemand: number | null
}

export interface ChargeItem {
  chargeItemName: string
  chargeAmount: number
}

export interface RechargeRecord {
  orderID: string
  rechargeDate: string
  totalAmount: number
  energyAmount: number
  VAT: number
  rebate: number
  chargeItems: ChargeItem[]
  orderStatus: string
  tokenNo: string
  seqNo: number
}

export interface DailyUsage {
  date: string
  kwh: number
  taka: number
}

export interface MonthlyUsage {
  month: string
  kwh: number
  taka: number
  maxDemandKw: number | null
}
