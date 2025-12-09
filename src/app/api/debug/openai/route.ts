import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const testMessage = body.message || "Hello, this is a test message.";
    
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    // Check if API key exists
    const keyInfo = {
      exists: !!openaiApiKey,
      length: openaiApiKey?.length || 0,
      prefix: openaiApiKey ? `${openaiApiKey.substring(0, 7)}...` : 'N/A',
    };

    if (!openaiApiKey) {
      return NextResponse.json({
        debug: true,
        error: 'OPENAI_API_KEY not configured',
        keyInfo,
        timestamp: new Date().toISOString(),
      });
    }

    // Prepare the request
    const requestBody = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Respond briefly.' },
        { role: 'user', content: testMessage }
      ],
      max_tokens: 100,
      temperature: 0.7,
    };

    const requestInfo = {
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey.substring(0, 7)}...`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    };

    // Make the request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseTime = Date.now() - startTime;

    // Get raw response
    const rawResponseText = await response.text();
    let parsedResponse: any = null;
    let parseError: string | null = null;

    try {
      parsedResponse = JSON.parse(rawResponseText);
    } catch (e) {
      parseError = `Failed to parse response: ${e instanceof Error ? e.message : 'Unknown error'}`;
    }

    const responseInfo = {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      rawBody: rawResponseText.substring(0, 2000), // Limit raw body size
      parsedBody: parsedResponse,
      parseError,
    };

    return NextResponse.json({
      debug: true,
      success: response.ok,
      keyInfo,
      request: requestInfo,
      response: responseInfo,
      responseTimeMs: responseTime,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      debug: true,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      responseTimeMs: responseTime,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  return NextResponse.json({
    debug: true,
    keyInfo: {
      exists: !!openaiApiKey,
      length: openaiApiKey?.length || 0,
      prefix: openaiApiKey ? `${openaiApiKey.substring(0, 7)}...` : 'N/A',
    },
    hint: 'Use POST with { "message": "your test message" } to test the API',
    timestamp: new Date().toISOString(),
  });
}

