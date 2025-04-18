'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function HomePage() {
  const router = useRouter()
  const [models, setModels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedModel, setSelectedModel] = useState<any | null>(null)

  useEffect(() => {
    // Fetch the model metadata from Pinata
    const fetchModels = async () => {
      try {
        // In a real app, you would likely have an API that returns a list of models
        // For now, we'll use the single model from the provided link
        const response = await fetch('https://gateway.pinata.cloud/ipfs/QmeaS5X6M8i2MGUMrtWKXn9DRfXU2T9o8HE82MvsUzdb7Z')
        const modelData = await response.json()
        
        // Add a display name based on the role
        modelData.displayName = `${modelData.role} (${modelData.textSample.substring(0, 15)}${modelData.textSample.length > 15 ? '...' : ''})`
        
        setModels([modelData])
      } catch (error) {
        console.error('Error fetching models:', error)
        setModels([])
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [])

  const handleModelSelect = (model: any) => {
    setSelectedModel(model)
  }

  const startChat = () => {
    if (!selectedModel) return
    
    // Store the metadata in sessionStorage for the chat page to use
    sessionStorage.setItem('chatbotMetadata', JSON.stringify(selectedModel))
    
    // Navigate to the chat page
    router.push('/chat')
  }

  const viewMetadata = (url: string, e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-blue-500 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-6 md:p-10">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Groq AI Chat - Model Selection
          </h1>
          
          <p className="text-gray-600 mb-10 text-center">
            Select a model to create a custom AI chatbot using its metadata
          </p>
          
          <section className={styles.modelsSection}>
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">Your AI Models</h2>
            
            {loading ? (
              <div className="text-center py-10">
                <div className="flex justify-center">
                  <div className="h-3 w-3 bg-purple-500 rounded-full animate-bounce"></div>
                  <div className="h-3 w-3 bg-purple-500 rounded-full animate-bounce mx-2" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-3 w-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <p className="mt-4 text-gray-600">Loading models...</p>
              </div>
            ) : (
              <div className={styles.grid}>
                {models.map((model, index) => (
                  <div 
                    key={index} 
                    className={`${styles.card} p-6 border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow 
                      ${selectedModel === model ? 'ring-2 ring-purple-500 bg-purple-50' : 'bg-white'}`}
                    onClick={() => handleModelSelect(model)}
                  >
                    <h3 className="text-xl font-medium mb-2">{model.displayName}</h3>
                    <p className="text-gray-600 mb-4 text-sm">
                      Address: {model.address.substring(0, 8)}...{model.address.substring(model.address.length - 6)}
                    </p>
                    <div className="flex justify-between items-center">
                      <button
                        onClick={(e) => viewMetadata('https://gateway.pinata.cloud/ipfs/QmeaS5X6M8i2MGUMrtWKXn9DRfXU2T9o8HE82MvsUzdb7Z', e)}
                        className={`${styles.link} text-blue-500 hover:text-blue-700`}
                      >
                        View Metadata
                      </button>
                      <button 
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModelSelect(model);
                        }}
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
                {models.length === 0 && <p className="text-gray-500">No models found</p>}
              </div>
            )}
          </section>
          
          <div className="mt-10 flex justify-center">
            <button
              onClick={startChat}
              disabled={!selectedModel}
              className={`px-8 py-3 rounded-lg font-medium text-lg transition-all
                ${selectedModel 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:opacity-90' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              Start Chatting with Selected Model
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}