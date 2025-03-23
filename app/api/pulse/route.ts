import { NextResponse } from 'next/server';
import { createXAI } from '@ai-sdk/xai';
import { generateText } from 'ai';

// Initialize the xAI provider with the API key from environment variables
const xai = createXAI({
  apiKey: process.env.XAI_API_KEY,
});

export async function POST(request: Request) {
  const { description } = await request.json();

  try {
    // Use xAI's Grok model to generate a poetic phrase
    const { text: phrase } = await generateText({
      model: xai('grok-2'),
      prompt: `Interpret this environment as an entity beyond human perception: "${description}". Respond in five words or fewer, abstract and evocative.`,
      maxTokens: 10,
    });

    return NextResponse.json({
      phrase,
      color: '#4a90e2',
      pulseRate: 0.5,
    });
  } catch (error) {
    console.error('Error generating pulse:', error);
    return NextResponse.json(
      { error: 'Failed to generate pulse' },
      { status: 500 }
    );
  }
}