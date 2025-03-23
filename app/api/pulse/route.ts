import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { description } = await request.json();
  const phrase = `Echoes of ${description}`;
  return NextResponse.json({ phrase, color: '#4a90e2', pulseRate: 0.5 });
}