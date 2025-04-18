'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

type UserContext = {
  userId?: string;
  preferences?: any;
  history?: any[];
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [displayMessages, setDisplayMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [metadata, setMetadata] = useState<any>(null)
  const [userContext, setUserContext] = useState<UserContext>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Try to get metadata from sessionStorage
    const storedMetadata = sessionStorage.getItem('chatbotMetadata')
    
    if (!storedMetadata) {
      // No metadata found, redirect back to model selection
      router.push('/')
      return
    }
    
    try {
      const parsedMetadata = JSON.parse(storedMetadata)
      
      // Add additional metadata if not present
      if (!parsedMetadata.createdAt) {
        parsedMetadata.createdAt = new Date().toISOString()
      }
      
      if (!parsedMetadata.visibility) {
        parsedMetadata.visibility = "public"
      }
      
      setMetadata(parsedMetadata)
      
      // Fetch user context if this is a private model
      if (parsedMetadata.visibility === "private") {
        // In a real app, you would fetch user data from your backend
        // For now, we'll just set some dummy data
        setUserContext({
          userId: "user123",
          preferences: { theme: "dark", language: "en" },
          history: []
        })
      }
      
      // Create a system message based on the role and textSample
      const systemMessage: Message = {
        role: 'system',
        content: `You are an AI twin created on the AI Cloning Platform with the role of ${parsedMetadata.role} and expertise in "${parsedMetadata.textSample}".`
      }
      
      // Generate a welcome message based on the role and visibility
      const welcomeMessage: Message = {
        role: 'assistant',
        content: generateWelcomeMessage(parsedMetadata)
      }
      
      // Set both the internal message history and display messages
      setMessages([systemMessage])
      setDisplayMessages([welcomeMessage])
      
    } catch (error) {
      console.error('Error parsing metadata:', error)
      router.push('/')
    }
  }, [router])

  // Generate a welcome message based on the model's role and visibility
  const generateWelcomeMessage = (metadata: any) => {
    const { role, textSample, visibility } = metadata
    
    const platformContext = "I'm an AI twin created on the AI Cloning Platform"
    const expertiseContext = `with expertise in "${textSample}"`
    
    let greeting = ""
    
    switch(role.toLowerCase()) {
      case 'chatbot':
        greeting = `Hello! ${platformContext} as a ${role} ${expertiseContext}.`
        break
      case 'assistant':
        greeting = `Hi there! ${platformContext} as your personal ${role} ${expertiseContext}.`
        break
      case 'teacher':
        greeting = `Welcome! ${platformContext} as a ${role} ${expertiseContext}.`
        break
      case 'coach':
        greeting = `Hey there! ${platformContext} as your ${role} ${expertiseContext}.`
        break
      default:
        greeting = `Hello! ${platformContext} with the role of "${role}" ${expertiseContext}.`
    }
    
    if (visibility === "private") {
      greeting += " Since I'm configured as a private model, I'll personalize my responses to you. Would you mind sharing a bit about yourself so I can assist you better?"
    } else {
      greeting += " How can I help you today?"
    }
    
    return greeting
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!input.trim() || !metadata) return

    const userMessage: Message = { role: 'user', content: input }
    
    // Add user message to both internal and display messages
    setMessages(prev => [...prev, userMessage])
    setDisplayMessages(prev => [...prev, userMessage])
    
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input,
          metadata: metadata,
          userContext: metadata.visibility === "private" ? userContext : undefined,
          history: messages.filter(msg => msg.role !== 'system')
        }),
      })

      const data = await response.json()
      
      if (data.content) {
        const assistantMessage: Message = { role: 'assistant', content: data.content }
        
        // Add assistant response to both internal and display messages
        setMessages(prev => [...prev, assistantMessage])
        setDisplayMessages(prev => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = { 
          role: 'assistant', 
          content: "Sorry, I couldn't process your request." 
        }
        setDisplayMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = { 
        role: 'assistant', 
        content: "Sorry, there was an error processing your request." 
      }
      setDisplayMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with model info */}
      {metadata && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-4 shadow-md">
          <div className="mx-auto max-w-3xl flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">{metadata.role}</h1>
              <p className="text-sm opacity-80">Based on: {metadata.textSample}</p>
              <p className="text-xs opacity-60">
                {metadata.visibility === "private" ? "Private Model" : "Public Model"} • 
                Created: {new Date(metadata.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button 
              onClick={() => router.push('/')}
              className="px-3 py-1 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-all text-sm"
            >
              Change Model
            </button>
          </div>
        </div>
      )}
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl">
          {displayMessages.length === 0 && (
            <div className="text-center py-20">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading your AI twin...</h2>
              <div className="flex justify-center mt-4">
                <div className="h-2 w-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div
                  className="h-2 w-2 bg-purple-400 rounded-full animate-bounce mx-2"
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className="h-2 w-2 bg-purple-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                ></div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {displayMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md p-4 rounded-xl shadow ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-md p-4 rounded-xl bg-white text-gray-400 rounded-bl-none border border-gray-200 shadow">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div
                      className="h-2 w-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                    <div
                      className="h-2 w-2 bg-purple-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="border-t border-gray-200 p-4 bg-white shadow-md">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading || !metadata}
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-3 rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-70 font-medium"
              disabled={isLoading || !input.trim() || !metadata}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}