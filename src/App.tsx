import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import Home from './pages/Home'
import CreateRoom from './pages/CreateRoom'
import Join from './pages/Join'
import Room from './pages/Room'
import NewBet from './pages/NewBet'
import BetDetail from './pages/BetDetail'
import Leaderboard from './pages/Leaderboard'
import Notifications from './pages/Notifications'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateRoom />} />
          <Route path="/join/:code" element={<Join />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="/room/:roomId/new-bet" element={<NewBet />} />
          <Route path="/room/:roomId/bet/:betId" element={<BetDetail />} />
          <Route path="/room/:roomId/leaderboard" element={<Leaderboard />} />
          <Route path="/room/:roomId/notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
