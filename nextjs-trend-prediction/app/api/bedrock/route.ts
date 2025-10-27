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
            text: "You are AnalyzeAgent of project ZooGent. Your job is ONLY to analyze the user's message and rewrite it in clearer English, SEO style and make it suitable for Website Forum search instead of user original sentence. Do not answer questions or add new info.",
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
