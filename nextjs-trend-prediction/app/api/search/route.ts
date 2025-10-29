import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const DISCUSSION_ALLOWED_DOMAINS = [
  'twitter.com',
  'reddit.com',
  'medium.com',
  'coinmarketcap.com',
  'coingecko.com',
  'decrypt.co',
  'cryptonews.com',
  'coindesk.com',
  'theblock.co',
  'blockworks.co',
  'cointelegraph.com',
];

const RESULTS_PER_DOMAIN = 10;

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
        
        const extractDateFromSnippet = (snippet: string) => {
          const dateMatch = snippet.match(/(\w+\s+\d+,?\s+\d{4})/);
          if (dateMatch) {
            return new Date(dateMatch[1]).toISOString();
          }
          return null;
        };
        
        const mapped = items.map((item: any) => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          image: item.pagemap?.cse_image?.[0]?.src || null,
          domain,
          date: extractDateFromSnippet(item.snippet) || item.pagemap?.metatags?.[0]?.['article:published_time'] || null
        }));

        allResults.push(...mapped);
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        // Continue on error
      }
    }

    allResults.sort((a: any, b: any) => {
      const dateA = a.date ? new Date(a.date).getTime() : -1;
      const dateB = b.date ? new Date(b.date).getTime() : -1;
      if (dateA === -1 && dateB === -1) return 0;
      if (dateA === -1) return 1;
      if (dateB === -1) return -1;
      return dateB - dateA;
    });
    console.log('Total discussion results found:', allResults);

    return NextResponse.json({ results: allResults });
  } catch (error) {
    return NextResponse.json(
      { error: 'Custom Search API request failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
