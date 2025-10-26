import { GiCrossedBones } from 'react-icons/gi'
import '../App.css'
import './Home.css'

function Home() {
  return (
    <div className="page-container">
      <div className="home-content">
        <div className="home-icon">
          <GiCrossedBones />
        </div>
        <h1 className="home-title">Welcome to BareBones Claude Chat</h1>
        <p className="home-description">
          A minimalist chat interface for Claude AI. No additional system prompts,
          no extra tools—just pure, unfiltered conversation with Claude.
        </p>
        <p className="home-subtext">
          Navigate to <span className="highlight">Chat</span> to start a conversation.
        </p>
      </div>
    </div>
  )
}

export default Home
