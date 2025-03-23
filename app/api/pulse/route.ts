import { NextResponse } from 'next/server';
import Sentiment from 'sentiment';

const sentiment = new Sentiment();

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

    // Perform sentiment analysis on the generated phrase
    const sentimentAnalysis = sentiment.analyze(phrase);
    const sentimentScore = sentimentAnalysis.score;

    // Adjust color and pulseRate based on sentiment
    let color = '#4a90e2'; // Default blue
    let pulseRate = 0.5;   // Default rate
    if (sentimentScore > 0) {
      color = '#ffff00';   // Positive: Yellow
      pulseRate = 0.8;     // Faster for positive
    } else if (sentimentScore < 0) {
      color = '#000088';   // Negative: Dark blue
      pulseRate = 0.3;     // Slower for negative
    } else if (phrase.toLowerCase().includes('dark') || phrase.toLowerCase().includes('shadow')) {
      color = '#440044';   // Dark purple for thematic match
      pulseRate = 0.4;
    } else if (phrase.toLowerCase().includes('ethereal') || phrase.toLowerCase().includes('spirit')) {
      color = '#88ccff';   // Light blue for ethereal
      pulseRate = 0.7;
    }

    return NextResponse.json({
      phrase,
      color,
      pulseRate,
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