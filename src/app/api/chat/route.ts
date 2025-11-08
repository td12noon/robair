import { NextRequest, NextResponse } from 'next/server';
import { flightAware } from '@/lib/flightaware';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history = [] } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;

    // Get flight data for context
    const aircraftIdent = process.env.NEXT_PUBLIC_AIRCRAFT_TAIL_NUMBER || 'N424BB';
    let flightContext = '';

    try {
      const endDate = new Date();
      const startDate = new Date('2024-01-01');
      const response = await flightAware.getFlightByIdent(aircraftIdent, startDate, endDate, 10);
      const flights = response.flights || [];

      // Calculate basic stats for context
      const currentYear = new Date().getFullYear();
      const thisYearFlights = flights.filter(flight => {
        const flightDate = new Date((flight as any).actual_off || (flight as any).scheduled_off || '');
        return flightDate.getFullYear() === currentYear;
      });

      const totalMiles = thisYearFlights.reduce((sum, flight) => sum + (flight.route_distance || 0), 0);
      const angelFlights = thisYearFlights.filter(flight => flight.operator === 'NGF');
      const angelFlightMiles = angelFlights.reduce((sum, flight) => sum + (flight.route_distance || 0), 0);

      flightContext = `
Current aircraft data for ${aircraftIdent}:
- Total flights in ${currentYear}: ${thisYearFlights.length}
- Total miles flown in ${currentYear}: ${totalMiles} nautical miles
- Angel Flights (NGF operator): ${angelFlights.length} flights, ${angelFlightMiles} nautical miles
- Aircraft type: ${flights[0]?.aircraft_type || 'SR22'}
- Recent flight status: ${flights[0]?.status || 'Unknown'}
`;

      if (flights.length > 0) {
        flightContext += `\nRecent flights:\n`;
        flights.slice(0, 3).forEach((flight, index) => {
          const date = new Date((flight as any).actual_off || (flight as any).scheduled_off || '').toLocaleDateString();
          flightContext += `${index + 1}. ${flight.origin?.code || '?'} → ${flight.destination?.code || '?'} on ${date} (${flight.route_distance || 0} nm, ${flight.operator || 'Unknown operator'})\n`;
        });
      }
    } catch (error) {
      console.warn('Could not fetch flight context:', error);
      flightContext = `Aircraft: ${aircraftIdent} (flight data temporarily unavailable)`;
    }

    // If no OpenAI API key, provide basic responses
    if (!openaiApiKey) {
      const lowerMessage = message.toLowerCase();
      let response = `Hi! I'm your Rob Air assistant. I have access to your flight data for ${aircraftIdent}, but I need an OpenAI API key to provide advanced AI responses.\n\n`;

      if (lowerMessage.includes('flight') || lowerMessage.includes('angel')) {
        response += `Based on your current data:\n${flightContext}\n\nTo enable advanced AI responses, please configure the OPENAI_API_KEY environment variable.`;
      } else if (lowerMessage.includes('help')) {
        response += `I can help you with information about your aircraft and flights. Try asking about:\n- Total flights this year\n- Angel Flight statistics\n- Recent flight history\n- Flight distances and destinations\n\nFor advanced AI responses, please configure the OPENAI_API_KEY environment variable.`;
      } else {
        response += `I can provide basic flight information. ${flightContext}\n\nFor advanced AI chat capabilities, please configure the OPENAI_API_KEY environment variable.`;
      }

      return NextResponse.json({
        response,
        timestamp: new Date().toISOString()
      });
    }

    // System prompt for the AI assistant
    const systemPrompt = `You are Rob Air Assistant, a helpful AI assistant for a pilot. You have access to real-time flight data and can answer questions about:

${flightContext}

You should:
- Be friendly and professional
- Use aviation terminology appropriately
- Provide specific data when available
- Be helpful with flight planning, maintenance questions, and aircraft information
- If you don't have specific data, be honest about it
- Focus on being useful for a pilot managing their aircraft

Keep responses concise but informative. Use nautical miles (nm) for distances and standard aviation terminology.`;

    // Prepare messages for OpenAI
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-nano',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      let errorDetails = 'Unknown error';
      try {
        const error = await openaiResponse.json();
        errorDetails = error.error?.message || JSON.stringify(error);
      } catch (e) {
        errorDetails = `HTTP ${openaiResponse.status}: ${openaiResponse.statusText}`;
      }

      console.error('OpenAI API error:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        details: errorDetails
      });

      // More specific error messages based on status
      let userMessage = "I'm having trouble connecting to my AI service right now.";
      if (openaiResponse.status === 401) {
        userMessage = "There's an issue with the AI service authentication. Please check the API key configuration.";
      } else if (openaiResponse.status === 429) {
        userMessage = "The AI service is currently busy. Please try again in a moment.";
      } else if (openaiResponse.status >= 500) {
        userMessage = "The AI service is temporarily unavailable. Please try again later.";
      }

      return NextResponse.json({
        response: userMessage,
        error: 'OpenAI API error',
        details: errorDetails
      });
    }

    const openaiData = await openaiResponse.json();
    const assistantMessage = openaiData.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({
      response: assistantMessage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        response: "I encountered an error while processing your request. Please try again.",
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}