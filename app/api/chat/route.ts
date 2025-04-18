import { NextRequest, NextResponse } from 'next/server'
import Groq from "groq-sdk"

// Define a message interface
interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, metadata, history = [] } = await request.json()
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }
    
    // Extract role and textSample from metadata
    const { role, textSample } = metadata || { role: 'assistant', textSample: 'general knowledge' }
    
    // Check if API key is configured
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured in environment variables' },
        { status: 500 }
      )
    }
    
    // Initialize Groq client
    const groq = new Groq({ apiKey })
    
    // Create a system prompt based on the role and textSample
    const systemPrompt = `You are an AI with the role of ${role}.
    You have expertise in "${textSample}" and should incorporate this knowledge into your responses.
    Always respond in a style and with knowledge consistent with your role as ${role} and your expertise in ${textSample}.
    If relevant, you may reference concepts, techniques, or terminologies related to ${textSample} in your responses.
    Your tone should match what would be expected from someone in the role of ${role}.`
    
    // Prepare conversation history with system message at the beginning
    const conversationHistory: Message[] = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message }
    ]
    
    // Send request to Groq with the entire conversation history
    const chatCompletion = await groq.chat.completions.create({
      messages: conversationHistory,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1000,
    })
    
    // Get the assistant's response
    const assistantResponse = chatCompletion.choices[0]?.message?.content || 
      "Sorry, I couldn't generate a response."
    
    // Add the new assistant response to history
    const updatedHistory = [
      ...history,
      { role: "user", content: message },
      { role: "assistant", content: assistantResponse }
    ]
    
    return NextResponse.json({
      content: assistantResponse,
      history: updatedHistory
    })
  } catch (error: any) {
    console.error('Groq API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}