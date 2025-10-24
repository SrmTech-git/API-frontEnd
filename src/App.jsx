import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [totalTokens, setTotalTokens] = useState(0)
  const [cacheTimeLeft, setCacheTimeLeft] = useState(0) // Cache timer in seconds
  const [contextEnabled, setContextEnabled] = useState(false)
  const [contextLocked, setContextLocked] = useState(false)
  const [copiedId, setCopiedId] = useState(null) // Track which item was just copied
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  // Cache countdown timer effect
  useEffect(() => {
    if (cacheTimeLeft <= 0) return

    const timer = setInterval(() => {
      setCacheTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [cacheTimeLeft])

  // Sends message to Claude AI through backend
  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    // Lock context toggle after first message
    if (!contextLocked) {
      setContextLocked(true)
    }

    // Add user message to chat
    const userMessage = { role: 'user', content: inputMessage }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputMessage('')
    setIsLoading(true)

    try {
      // Send entire conversation history to backend API with context flag
      const response = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          contextEnabled: contextEnabled
        })
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

      // Reset cache timer to 5 minutes (300 seconds)
      setCacheTimeLeft(300)
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

  // Download chat as text file
  const downloadChat = () => {
    try {
      // Build the text content
      const timestamp = new Date().toLocaleString()
      let textContent = `CLAUDE CHAT CONVERSATION\n`
      textContent += `Downloaded: ${timestamp}\n`
      textContent += `${'='.repeat(60)}\n\n`

      // Loop through all messages
      messages.forEach((msg, index) => {
        const label = msg.role === 'user' ? 'USER' : 'CLAUDE'
        textContent += `${label}:\n`
        textContent += `${msg.content}\n`

        // Add thinking content if available
        if (msg.thinking) {
          textContent += `\n[THINKING PROCESS]:\n`
          textContent += `${msg.thinking}\n`
        }

        textContent += `\n${'-'.repeat(60)}\n\n`
      })

      // Add total token usage at the end
      textContent += `${'='.repeat(60)}\n`
      textContent += `TOTAL TOKENS USED: ${totalTokens.toLocaleString()}\n`
      textContent += `${'='.repeat(60)}\n`

      // Create blob and download
      const blob = new Blob([textContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      // Format filename: claude-chat-YYYY-MM-DD-HHmm.txt
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const filename = `claude-chat-${year}-${month}-${day}-${hours}${minutes}.txt`

      link.href = url
      link.download = filename
      link.click()

      // Clean up
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading chat:', error)
      alert('Failed to download chat. Please try again.')
    }
  }

  // Copy text to clipboard
  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      alert('Failed to copy to clipboard')
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>Claude AI Chat</h1>
        <div className="header-stats">
          <button
            className="download-btn"
            onClick={downloadChat}
            disabled={messages.length === 0}
            title={messages.length === 0 ? 'No messages to download' : 'Download chat as text file'}
          >
            Download Chat
          </button>
          <div className="context-toggle-container">
            <label className={`context-toggle ${contextLocked ? 'locked' : ''}`}>
              <input
                type="checkbox"
                checked={contextEnabled}
                onChange={(e) => setContextEnabled(e.target.checked)}
                disabled={contextLocked}
              />
              <span className="toggle-label">Include Context</span>
            </label>
            <div className="context-status">
              Context: <span className={contextEnabled ? 'status-on' : 'status-off'}>
                {contextEnabled ? 'ON' : 'OFF'}
              </span>
              {contextLocked && <span className="locked-indicator"> 🔒</span>}
            </div>
          </div>
          <div className="token-counter">
            <span className="token-label">Tokens Used:</span>
            <span className="token-count">{totalTokens.toLocaleString()}</span>
          </div>
          <div className="cache-timer">
            <span className="cache-label">Cache Expires:</span>
            <span className={`cache-time ${cacheTimeLeft === 0 ? 'expired' : ''}`}>
              {cacheTimeLeft > 0
                ? `${Math.floor(cacheTimeLeft / 60)}:${String(cacheTimeLeft % 60).padStart(2, '0')}`
                : 'Expired'}
            </span>
          </div>
        </div>
      </header>

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
                      <summary>
                        View Thinking Process
                        <button
                          className="copy-btn"
                          onClick={(e) => {
                            e.preventDefault()
                            copyToClipboard(msg.thinking, `thinking-${index}`)
                          }}
                          title="Copy thinking to clipboard"
                        >
                          {copiedId === `thinking-${index}` ? '✓' : '⎘'}
                        </button>
                      </summary>
                      <div className="thinking-content">{msg.thinking}</div>
                    </details>
                  )}
                  <div className="message-content-wrapper">
                    <div className="message-content">{msg.content}</div>
                    <button
                      className="copy-btn"
                      onClick={() => copyToClipboard(msg.content, `message-${index}`)}
                      title="Copy message to clipboard"
                    >
                      {copiedId === `message-${index}` ? '✓' : '⎘'}
                    </button>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="message assistant">
                <div className="message-label">Claude</div>
                <div className="message-content">
                  Thinking
                  <span className="loading-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </div>
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
