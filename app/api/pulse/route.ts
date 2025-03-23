import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { description } = await request.json();

  // Validate the description
  if (!description || typeof description !== 'string') {
    return NextResponse.json(
      {
        phrase: 'Invalid input provided',
        color: '#ff0000',
        pulseRate: 0.5,
        error: 'Description must be a non-empty string',
      },
      { status: 400 }
    );
  }

  // Log the API key for debugging (be careful not to expose this in production logs)
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        phrase: `Fallback: Echoes of ${description}`,
        color: '#ff0000',
        pulseRate: 0.5,
        error: 'XAI_API_KEY is not set',
      },
      { status: 500 }
    );
  }

  try {
    // Make a direct HTTP request to xAI's API
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        messages: [
          {
            role: 'system',
            content: 'You are Grok, a chatbot inspired by the Hitchhiker\'s Guide to the Galaxy.',
          },
          {
            role: 'user',
            content: `Interpret this environment as an entity beyond human perception: "${description}". Respond in five words or fewer, abstract and evocative.`,
          },
        ],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`xAI API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('Invalid response format from xAI API');
    }

    const phrase = data.choices[0].message.content.trim();

    return NextResponse.json({
      phrase,
      color: '#4a90e2',
      pulseRate: 0.5,
    });
  } catch (error: any) {
    console.error('Error generating pulse:', error);
    return NextResponse.json(
      {
        phrase: `Fallback: Echoes of ${description}`,
        color: '#ff0000',
        pulseRate: 0.5,
        error: error.message,
        errorDetails: error.stack || 'No stack trace available',
      },
      { status: 500 }
    );
  }
}