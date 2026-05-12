import { HIGH_REVENUE_BUCKETS } from './constants'

export function deriveStage(record) {
  if (record.outcome === 'Sold') return 'Sold'
  if (record.outcome === 'Not Interested') return 'Not Interested'
  if (record.booked_slot) {
    if (HIGH_REVENUE_BUCKETS.includes(record.annual_revenue)) return 'Qualified'
    return 'Appointment'
  }
  return 'Lead'
}
