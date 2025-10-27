import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const DISCUSSION_ALLOWED_DOMAINS = [
  'twitter.com',
  'reddit.com',
  'discord.com',
  'medium.com',
  'github.com',
  'coinmarketcap.com',
  'coingecko.com',
];

const RESULTS_PER_DOMAIN = 1;

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query) {
    return NextResponse.json(
      { error: "Missing 'query' in request body" },
      { status: 400 }
    );
  }

  // Debug: Check environment variables
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  const cx = process.env.NEXT_PUBLIC_GOOGLE_CX;
  
  if (!apiKey || !cx) {
    return NextResponse.json(
      { error: 'Missing Google API credentials in environment' },
      { status: 500 }
    );
  }

  try {
    const allResults = [];

    for (const domain of DISCUSSION_ALLOWED_DOMAINS) {
      try {
        const domainQuery = `${query} site:${domain}`;
        
        const url = 'https://www.googleapis.com/customsearch/v1';
        const params = {
          key: apiKey,
          cx: cx,
          q: domainQuery,
          num: RESULTS_PER_DOMAIN
        };
        
        const response = await axios.get(url, { params });

        const items = response.data.items || [];
        
        const mapped = items.map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          image: item.pagemap?.cse_image?.[0]?.src || null,
          domain
        }));

        allResults.push(...mapped);
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        // Continue on error
      }
    }

    return NextResponse.json({ results: allResults });
  } catch (error) {
    return NextResponse.json(
      { error: 'Custom Search API request failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
