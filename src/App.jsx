import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Tools from './pages/Tools'
import History from './pages/History'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />

        <div className="main-layout">
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/tools/:conversationId" element={<Tools />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/history" element={<History />} />
            </Routes>
          </main>

          <footer className="footer">
            <p>Powered by Claude AI</p>
          </footer>
        </div>
      </div>
    </Router>
  )
}

export default App
