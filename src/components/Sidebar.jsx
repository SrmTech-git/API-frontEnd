import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiHome, FiMessageSquare, FiTool, FiClock, FiMenu, FiX } from 'react-icons/fi'
import './Sidebar.css'

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Home', icon: FiHome },
    { path: '/chat', label: 'Chat', icon: FiMessageSquare },
    { path: '/tools', label: 'Tools', icon: FiTool },
    { path: '/history', label: 'History', icon: FiClock }
  ]

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button
        className="toggle-btn"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <FiMenu /> : <FiX />}
      </button>

      <nav className="nav-menu">
        {navItems.map((item) => {
          const IconComponent = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              title={item.label}
            >
              <span className="nav-icon"><IconComponent /></span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export default Sidebar
