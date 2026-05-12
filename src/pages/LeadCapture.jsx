import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { normalizePhone } from '../lib/phoneUtils'
import { EMPLOYEE_BUCKETS, REVENUE_BUCKETS } from '../lib/constants'

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

function formatSlot(slot) {
  const [start, end] = slot.split('-')
  function fmt(hStr) {
    const h = parseInt(hStr, 10)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${h12}:00 ${ampm}`
  }
  return `${fmt(start)} - ${fmt(end)}`
}

function formatDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '8px 10px',
  marginTop: 4,
  border: '1px solid #d1d5db',
  borderRadius: 4,
  fontSize: 14,
}

export default function LeadCapture() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    extra_notes: '',
    num_employees: '',
    annual_revenue: '',
  })
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [takenSlots, setTakenSlots] = useState(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const days = getNextFiveDays()
  const timeSlots = generateTimeSlots()

  useEffect(() => {
    supabase
      .from('pipeline')
      .select('booked_slot')
      .not('booked_slot', 'is', null)
      .then(({ data }) => {
        if (data) {
          setTakenSlots(new Set(data.map(r => r.booked_slot)))
        }
      })
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const { first_name, last_name, email, phone, extra_notes, num_employees, annual_revenue } = form
    if (!first_name || !last_name || !email || !phone || !extra_notes || !num_employees || !annual_revenue) {
      setError('All fields are required. Please complete the form.')
      return
    }

    setLoading(true)
    const { error: insertErr } = await supabase.from('pipeline').insert({
      first_name,
      last_name,
      email,
      phone,
      phone_normalized: normalizePhone(phone),
      extra_notes,
      num_employees,
      annual_revenue,
      booked_slot: selectedSlot,
    })
    setLoading(false)

    if (insertErr) {
      setError(insertErr.message)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: 24, textAlign: 'center' }}>
        <h1>Thank You!</h1>
        <p style={{ fontSize: 16, color: '#555' }}>Your submission has been received.</p>
        {selectedSlot ? (
          <p>
            Your appointment is booked for{' '}
            <strong>{formatDay(selectedSlot.split('_')[0])} at {formatSlot(selectedSlot.split('_')[1])}</strong>.
          </p>
        ) : (
          <p>We'll be in touch soon.</p>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: 24 }}>
      <h1 style={{ marginBottom: 4 }}>Get in Touch</h1>
      <p style={{ color: '#64748b', marginTop: 0, marginBottom: 24 }}>Fill out the form below and we'll reach out shortly.</p>

      <form onSubmit={handleSubmit}>
        <h2 style={{ fontSize: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>Contact Information</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <label>
            First Name
            <input type="text" name="first_name" value={form.first_name} onChange={handleChange} style={inputStyle} />
          </label>
          <label>
            Last Name
            <input type="text" name="last_name" value={form.last_name} onChange={handleChange} style={inputStyle} />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} style={inputStyle} />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Phone Number
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} style={inputStyle} />
          </label>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label>
            Extra Notes
            <textarea name="extra_notes" value={form.extra_notes} onChange={handleChange} rows={4} style={inputStyle} />
          </label>
        </div>

        <h2 style={{ fontSize: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>About Your Business</h2>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: '500', marginBottom: 8 }}>Number of Employees</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {EMPLOYEE_BUCKETS.map(b => (
              <label key={b} style={{ cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="radio"
                  name="num_employees"
                  value={b}
                  checked={form.num_employees === b}
                  onChange={handleChange}
                  style={{ marginRight: 5 }}
                />
                {b}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: '500', marginBottom: 8 }}>Annual Revenue</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {REVENUE_BUCKETS.map(b => (
              <label key={b} style={{ cursor: 'pointer', fontSize: 14 }}>
                <input
                  type="radio"
                  name="annual_revenue"
                  value={b}
                  checked={form.annual_revenue === b}
                  onChange={handleChange}
                  style={{ marginRight: 5 }}
                />
                {b}
              </label>
            ))}
          </div>
        </div>

        <h2 style={{ fontSize: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>Book an Appointment <span style={{ fontWeight: 'normal', color: '#94a3b8' }}>(Optional)</span></h2>
        <p style={{ color: '#64748b', marginTop: 0, fontSize: 14 }}>Select a 1-hour slot, or skip and submit without booking.</p>

        <div style={{ overflowX: 'auto', marginBottom: 16 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 500 }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 12px', border: '1px solid #e5e7eb', background: '#f1f5f9', textAlign: 'left', fontSize: 13 }}>
                  Time
                </th>
                {days.map(d => (
                  <th key={d} style={{ padding: '8px 10px', border: '1px solid #e5e7eb', background: '#f1f5f9', textAlign: 'center', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {formatDay(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(slot => (
                <tr key={slot}>
                  <td style={{ padding: '6px 12px', border: '1px solid #e5e7eb', fontSize: 13, whiteSpace: 'nowrap' }}>
                    {formatSlot(slot)}
                  </td>
                  {days.map(day => {
                    const key = `${day}_${slot}`
                    const taken = takenSlots.has(key)
                    const selected = selectedSlot === key
                    return (
                      <td key={day} style={{ padding: 6, border: '1px solid #e5e7eb', textAlign: 'center' }}>
                        {taken ? (
                          <span style={{ color: '#cbd5e1', fontSize: 12 }}>Taken</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedSlot(selected ? null : key)}
                            style={{
                              padding: '4px 10px',
                              background: selected ? '#1d4ed8' : '#f1f5f9',
                              color: selected ? 'white' : '#334155',
                              border: selected ? '1px solid #1d4ed8' : '1px solid #d1d5db',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            {selected ? 'Selected' : 'Book'}
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedSlot && (
          <p style={{ color: '#1d4ed8', fontSize: 14, marginBottom: 16 }}>
            Selected: <strong>{formatDay(selectedSlot.split('_')[0])} at {formatSlot(selectedSlot.split('_')[1])}</strong>
          </p>
        )}

        {error && <p style={{ color: '#dc2626', marginBottom: 12 }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 36px',
            background: loading ? '#94a3b8' : '#1d4ed8',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 15,
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  )
}
