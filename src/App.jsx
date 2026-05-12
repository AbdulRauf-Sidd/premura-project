import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import LeadCapture from './pages/LeadCapture'
import Dashboard from './pages/Dashboard'
import OutcomeForm from './pages/OutcomeForm'

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<LeadCapture />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/outcome" element={<OutcomeForm />} />
      </Routes>
    </BrowserRouter>
  )
}
