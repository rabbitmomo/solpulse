import { NextRequest, NextResponse } from 'next/server';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({
  region: 'ap-southeast-1',
});

export async function POST(req: NextRequest) {
  const { userMessage } = await req.json();

  if (!userMessage) {
    return NextResponse.json(
      { error: "Missing 'userMessage' in request body" },
      { status: 400 }
    );
  }

  try {
    const messages = [
      {
        role: 'user' as const,
        content: [{ text: userMessage }],
      },
      {
        role: 'assistant' as const,
        content: [
          {
            text: "You are agent of project Solpulse - On-Chain Sentiment Aggregator for Meme Coins.",
          },
        ],
      },
    ];

    const modelId = 'apac.amazon.nova-micro-v1:0';

    const command = new ConverseCommand({ modelId, messages });
    const response = await client.send(command);

    return NextResponse.json({ result: response });
  } catch (err) {
    console.error('Bedrock API error:', err);
    return NextResponse.json(
      { error: 'Bedrock request failed', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
