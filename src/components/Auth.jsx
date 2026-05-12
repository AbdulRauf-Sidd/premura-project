import { useState } from 'react'

const PASSWORD = 'admin123'

export default function Auth({ onAuth }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (pw === PASSWORD) {
      onAuth()
    } else {
      setErr(true)
    }
  }

  return (
    <div style={{ maxWidth: 320, margin: '100px auto', padding: 24, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <h2 style={{ marginTop: 0 }}>Internal Access</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setErr(false) }}
          placeholder="Password"
          style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 4, marginBottom: 8, fontSize: 14 }}
        />
        {err && <p style={{ color: '#dc2626', margin: '0 0 8px', fontSize: 14 }}>Incorrect password</p>}
        <button
          type="submit"
          style={{ width: '100%', padding: 10, background: '#1d4ed8', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
        >
          Enter
        </button>
      </form>
    </div>
  )
}
