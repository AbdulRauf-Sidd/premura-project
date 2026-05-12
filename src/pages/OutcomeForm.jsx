import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { normalizePhone } from '../lib/phoneUtils'
import Auth from '../components/Auth'

export default function OutcomeForm() {
  const [authed, setAuthed] = useState(false)
  const [phone, setPhone] = useState('')
  const [prospect, setProspect] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [outcome, setOutcome] = useState('')
  const [dealAmount, setDealAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function lookup(e) {
    e.preventDefault()
    setNotFound(false)
    setProspect(null)
    setSuccess(false)
    setError('')
    setOutcome('')
    setDealAmount('')

    const normalized = normalizePhone(phone)
    if (!normalized) {
      setError('Please enter a phone number.')
      return
    }

    const { data } = await supabase
      .from('pipeline')
      .select('*')
      .eq('phone_normalized', normalized)
      .not('first_name', 'is', null)
      .limit(1)

    if (data && data.length > 0) {
      setProspect(data[0])
    } else {
      setNotFound(true)
    }
  }

  async function submitOutcome(e) {
    e.preventDefault()
    if (!outcome) return
    if (outcome === 'Sold' && !dealAmount) {
      setError('Please enter the deal amount.')
      return
    }
    setError('')
    setLoading(true)

    const update = { outcome }
    if (outcome === 'Sold') {
      update.deal_amount = parseFloat(dealAmount)
    }

    const { error: updateErr } = await supabase
      .from('pipeline')
      .update(update)
      .eq('id', prospect.id)

    setLoading(false)
    if (updateErr) {
      setError(updateErr.message)
    } else {
      setSuccess(true)
    }
  }

  function reset() {
    setPhone('')
    setProspect(null)
    setNotFound(false)
    setOutcome('')
    setDealAmount('')
    setSuccess(false)
    setError('')
  }

  if (!authed) return <Auth onAuth={() => setAuthed(true)} />

  return (
    <div style={{ maxWidth: 560, margin: '40px auto', padding: 24 }}>
      <h1>Outcome Update</h1>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Step 1: Look Up Prospect</h2>
        <form onSubmit={lookup} style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={phone}
            onChange={e => { setPhone(e.target.value); setNotFound(false) }}
            placeholder="Phone number — any format"
            style={{ flex: 1, padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 }}
          />
          <button
            type="submit"
            style={{ padding: '9px 20px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
          >
            Find
          </button>
        </form>
        {notFound && (
          <p style={{ color: '#dc2626', margin: '12px 0 0', fontSize: 14 }}>
            No prospect found with that phone number.
          </p>
        )}
      </div>

      {prospect && !success && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: 16 }}>Step 2: Update Outcome</h2>

          <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 6, padding: 14, marginBottom: 16 }}>
            <div style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>
              {prospect.first_name} {prospect.last_name}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 3 }}>{prospect.email}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 3 }}>{prospect.phone}</div>
            <div style={{ fontSize: 13, marginBottom: 3 }}>Revenue: {prospect.annual_revenue}</div>
            <div style={{ fontSize: 13, marginBottom: 3 }}>Employees: {prospect.num_employees}</div>
            {prospect.booked_slot && (
              <div style={{ fontSize: 13, color: '#2563eb', marginBottom: 3 }}>
                Appointment: {prospect.booked_slot.replace('_', ' @ ')}
              </div>
            )}
            {prospect.extra_notes && (
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Notes: {prospect.extra_notes}</div>
            )}
          </div>

          <form onSubmit={submitOutcome}>
            <div style={{ marginBottom: 16, display: 'flex', gap: 24 }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15 }}>
                <input
                  type="radio"
                  name="outcome"
                  value="Sold"
                  checked={outcome === 'Sold'}
                  onChange={e => setOutcome(e.target.value)}
                />
                <span style={{ fontWeight: 'bold', color: '#16a34a' }}>Sold</span>
              </label>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 15 }}>
                <input
                  type="radio"
                  name="outcome"
                  value="Not Interested"
                  checked={outcome === 'Not Interested'}
                  onChange={e => setOutcome(e.target.value)}
                />
                <span style={{ fontWeight: 'bold', color: '#dc2626' }}>Not Interested</span>
              </label>
            </div>

            {outcome === 'Sold' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: 4, fontSize: 14 }}>
                  Deal Amount (USD)
                </label>
                <input
                  type="number"
                  value={dealAmount}
                  onChange={e => setDealAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 14 }}
                />
              </div>
            )}

            {error && <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>{error}</p>}

            <button
              type="submit"
              disabled={loading || !outcome}
              style={{
                padding: '10px 28px',
                background: loading || !outcome ? '#94a3b8' : '#16a34a',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: loading || !outcome ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: 14,
              }}
            >
              {loading ? 'Saving...' : 'Save Outcome'}
            </button>
          </form>
        </div>
      )}

      {success && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: 20 }}>
          <h3 style={{ marginTop: 0, color: '#15803d' }}>Outcome Saved!</h3>
          <p style={{ marginBottom: 16, fontSize: 14 }}>
            {prospect.first_name} {prospect.last_name} is now marked as <strong>{outcome}</strong>.
            {outcome === 'Sold' && dealAmount && ` Deal value: $${parseFloat(dealAmount).toLocaleString()}.`}
          </p>
          <button
            onClick={reset}
            style={{ padding: '8px 20px', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
          >
            Update Another
          </button>
        </div>
      )}
    </div>
  )
}
