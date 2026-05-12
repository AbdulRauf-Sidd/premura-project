import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { deriveStage } from '../lib/stageUtils'
import Auth from '../components/Auth'

const STAGES = ['Lead', 'Appointment', 'Qualified', 'Sold', 'Not Interested']

const STAGE_COLORS = {
  Lead: { bg: '#f0f9ff', border: '#bae6fd' },
  Appointment: { bg: '#fefce8', border: '#fde68a' },
  Qualified: { bg: '#f0fdf4', border: '#bbf7d0' },
  Sold: { bg: '#dcfce7', border: '#86efac' },
  'Not Interested': { bg: '#fef2f2', border: '#fecaca' },
}

function getNextFiveDays() {
  const days = []
  for (let i = 0; i < 5; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    days.push(`${yyyy}-${mm}-${dd}`)
  }
  return days
}

function generateTimeSlots() {
  const slots = []
  for (let h = 8; h <= 20; h++) {
    const start = String(h).padStart(2, '0')
    const end = String(h + 1).padStart(2, '0')
    slots.push(`${start}-${end}`)
  }
  return slots
}

function ProspectCard({ record, stage }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 6, padding: 12, marginBottom: 10 }}>
      <div style={{ fontWeight: 'bold', marginBottom: 4, fontSize: 14 }}>
        {record.first_name} {record.last_name}
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>{record.email}</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{record.phone}</div>
      <div style={{ fontSize: 12, marginBottom: 2 }}>Revenue: <strong>{record.annual_revenue}</strong></div>
      <div style={{ fontSize: 12, marginBottom: 2 }}>Employees: {record.num_employees}</div>
      {record.booked_slot && (
        <div style={{ fontSize: 12, color: '#2563eb', marginTop: 4 }}>
          Appt: {record.booked_slot.replace('_', ' @ ')}
        </div>
      )}
      {stage === 'Sold' && record.deal_amount != null && (
        <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 'bold', marginTop: 6 }}>
          Deal: ${Number(record.deal_amount).toLocaleString()}
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [authed, setAuthed] = useState(false)
  const [prospects, setProspects] = useState([])
  const [blocks, setBlocks] = useState([])
  const [blockDate, setBlockDate] = useState('')
  const [blockSlot, setBlockSlot] = useState('')
  const [blockLoading, setBlockLoading] = useState(false)

  const days = getNextFiveDays()
  const timeSlots = generateTimeSlots()

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from('pipeline')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) {
      setProspects(data.filter(r => r.first_name !== null))
      setBlocks(data.filter(r => r.first_name === null && r.booked_slot !== null))
    }
  }, [])

  useEffect(() => {
    if (authed) fetchData()
  }, [authed, fetchData])

  async function addBlock() {
    if (!blockDate || !blockSlot) return
    setBlockLoading(true)
    await supabase.from('pipeline').insert({ booked_slot: `${blockDate}_${blockSlot}` })
    await fetchData()
    setBlockLoading(false)
    setBlockDate('')
    setBlockSlot('')
  }

  async function removeBlock(id) {
    await supabase.from('pipeline').delete().eq('id', id)
    await fetchData()
  }

  if (!authed) return <Auth onAuth={() => setAuthed(true)} />

  const grouped = {}
  STAGES.forEach(s => { grouped[s] = [] })
  prospects.forEach(r => {
    const stage = deriveStage(r)
    if (stage && grouped[stage]) grouped[stage].push(r)
  })

  return (
    <div style={{ padding: 24, minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Pipeline Dashboard</h1>
        <span style={{ color: '#64748b', fontSize: 14 }}>{prospects.length} prospects total</span>
      </div>

      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
        {STAGES.map(stage => {
          const { bg, border } = STAGE_COLORS[stage]
          return (
            <div
              key={stage}
              style={{
                minWidth: 230,
                maxWidth: 260,
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: 8,
                padding: 12,
                flexShrink: 0,
              }}
            >
              <h3 style={{ margin: '0 0 12px', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#374151' }}>
                {stage} <span style={{ color: '#9ca3af', fontWeight: 'normal' }}>({grouped[stage].length})</span>
              </h3>
              {grouped[stage].map(r => (
                <ProspectCard key={r.id} record={r} stage={stage} />
              ))}
              {grouped[stage].length === 0 && (
                <p style={{ color: '#d1d5db', fontSize: 13, textAlign: 'center', marginTop: 20 }}>Empty</p>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 40, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
        <h2 style={{ marginTop: 0, marginBottom: 4 }}>Availability Manager</h2>
        <p style={{ color: '#64748b', marginTop: 0, fontSize: 14 }}>Block a slot to hide it from the booking calendar immediately.</p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Date</label>
            <select
              value={blockDate}
              onChange={e => setBlockDate(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 }}
            >
              <option value="">Select date</option>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Time Slot</label>
            <select
              value={blockSlot}
              onChange={e => setBlockSlot(e.target.value)}
              style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 }}
            >
              <option value="">Select slot</option>
              {timeSlots.map(t => {
                const [h] = t.split('-')
                const hour = parseInt(h, 10)
                const ampm = hour >= 12 ? 'PM' : 'AM'
                const h12 = hour > 12 ? hour - 12 : hour
                return <option key={t} value={t}>{h12}:00 {ampm} - {t.split('-')[1]}:00 {parseInt(t.split('-')[1], 10) >= 12 ? 'PM' : 'AM'}</option>
              })}
            </select>
          </div>
          <button
            onClick={addBlock}
            disabled={blockLoading || !blockDate || !blockSlot}
            style={{
              padding: '9px 20px',
              background: blockLoading || !blockDate || !blockSlot ? '#94a3b8' : '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: blockLoading || !blockDate || !blockSlot ? 'not-allowed' : 'pointer',
              fontSize: 14,
            }}
          >
            Block Slot
          </button>
        </div>

        {blocks.length > 0 ? (
          <div>
            <div style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Currently Blocked:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {blocks.map(b => (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#fee2e2',
                    border: '1px solid #fca5a5',
                    borderRadius: 4,
                    padding: '4px 10px',
                    fontSize: 13,
                  }}
                >
                  <span>{b.booked_slot.replace('_', ' ')}</span>
                  <button
                    onClick={() => removeBlock(b.id)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p style={{ color: '#d1d5db', fontSize: 13, margin: 0 }}>No slots currently blocked.</p>
        )}
      </div>
    </div>
  )
}
