import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Landing from './pages/Landing'
import Network from './pages/Network'
import Simulate from './pages/Simulate'
import Corridors from './pages/Corridors'
import Agents from './pages/Agents'
import Audit from './pages/Audit'

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/"          element={<Landing />} />
        <Route path="/network"   element={<Network />} />
        <Route path="/simulate"  element={<Simulate />} />
        <Route path="/corridors" element={<Corridors />} />
        <Route path="/agents"    element={<Agents />} />
        <Route path="/audit"     element={<Audit />} />
      </Routes>
    </BrowserRouter>
  )
}
