import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [totalTokens, setTotalTokens] = useState(0)
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Sends message to Claude AI through backend
  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    // Add user message to chat
    const userMessage = { role: 'user', content: inputMessage }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Send message to backend API
      const response = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputMessage })
      })

      const result = await response.json()

      // Add Claude's response to chat with thinking
      const assistantMessage = {
        role: 'assistant',
        content: result.response,
        thinking: result.thinking
      }
      setMessages(prev => [...prev, assistantMessage])

      // Update token counter
      if (result.totalTokens) {
        setTotalTokens(prev => prev + result.totalTokens)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = { role: 'assistant', content: 'Error: Could not connect to Claude AI' }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>Claude AI Chat</h1>
        <div className="token-counter">
          <span className="token-label">Tokens Used:</span>
          <span className="token-count">{totalTokens.toLocaleString()}</span>
        </div>
      </header>

      <nav className="sidebar">
        <ul>
          <li>New Chat</li>
          <li>History</li>
          <li>Settings</li>
        </ul>
      </nav>

      <main className="main-content">
        <div className="chat-container">
          <div className="messages-list">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>Start a conversation with Claude AI</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`message ${msg.role}`}>
                  <div className="message-label">
                    {msg.role === 'user' ? 'You' : 'Claude'}
                  </div>
                  {msg.thinking && (
                    <details className="thinking-block">
                      <summary>View Thinking Process</summary>
                      <div className="thinking-content">{msg.thinking}</div>
                    </details>
                  )}
                  <div className="message-content">{msg.content}</div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="message assistant">
                <div className="message-label">Claude</div>
                <div className="message-content">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              disabled={isLoading}
            />
            <button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()}>
              Send
            </button>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Powered by Claude AI</p>
      </footer>
    </div>
  )
}

export default App
