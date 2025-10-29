'use client';

import React, { useState } from 'react';

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  image?: string;
  domain: string;
}

export function GoogleSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = `${errorData.error || 'Failed to fetch search results'} - ${errorData.details || ''}`;
        console.error('Search API error details:', errorData);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('Search results:', data);
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Google Search API error:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="card border-0 shadow-lg h-100">
      <div className="card-header" style={{ background: '#14f195', borderRadius: '8px 8px 0 0' }}>
        <h5 className="mb-0" style={{ color: 'white' }}>
          Meme Coin Discussion Search
        </h5>
        <small className="text-light">Search across verified domains</small>
      </div>

      <div
        className="card-body"
        style={{
          height: '250px',
          overflowY: 'auto',
          background: '#1a1a2e',
          borderRadius: '0 0 0 8px',
        }}
      >
        <div className="mb-3">
          <div className="d-flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for trends, news, data..."
              className="form-control"
              style={{
                background: '#2a2a4e',
                border: '1px solid #14f195',
                color: '#e0e0e0',
              }}
              disabled={isLoading}
            />
            <button
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="btn"
              style={{ background: '#14f195', border: 'none', color: '#1a1a2e' }}
            >
              Search
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        {isLoading && (
          <div className="text-center text-secondary py-4">
            <p>🔄 Searching...</p>
          </div>
        )}

        {!hasSearched && !isLoading && (
          <div className="text-center text-secondary py-5">
            <p>Enter a search query to explore results</p>
            <small>Results are filtered by verified domains</small>
            <div style={{ marginTop: '15px', fontSize: '0.8rem' }}>
              <p style={{ color: '#14f195', fontWeight: 'bold', marginBottom: '8px' }}>Verified Domains:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                <span style={{ color: '#9945ff' }}>Twitter</span>
                <span style={{ color: '#9945ff' }}>Reddit</span>
                <span style={{ color: '#9945ff' }}>Medium</span>
                <span style={{ color: '#9945ff' }}>CoinMarketCap</span>
                <span style={{ color: '#9945ff' }}>CoinGecko</span>
                <span style={{ color: '#9945ff' }}>Decrypt</span>
                <span style={{ color: '#9945ff' }}>CryptoNews</span>
                <span style={{ color: '#9945ff' }}>CoinDesk</span>
                <span style={{ color: '#9945ff' }}>TheBlock</span>
                <span style={{ color: '#9945ff' }}>Blockworks</span>
                <span style={{ color: '#9945ff' }}>Cointelegraph</span>
              </div>
            </div>
          </div>
        )}

        {hasSearched && !isLoading && results.length === 0 && !error && (
          <div className="text-center text-secondary py-5">
            <p>📭 No results found for "{searchQuery}"</p>
            <small>Try a different search query</small>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result, idx) => (
              <a
                key={idx}
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-decoration-none d-block p-2 rounded"
                style={{
                  background: '#2a2a4e',
                  border: '1px solid #14f19533',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#3a3a5e';
                  e.currentTarget.style.borderColor = '#14f195';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#2a2a4e';
                  e.currentTarget.style.borderColor = '#14f19533';
                }}
              >
                <h6
                  className="mb-1"
                  style={{
                    color: '#14f195',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  {result.title}
                </h6>
                <small style={{ color: '#9945ff', display: 'block', marginBottom: '4px' }}>
                  {new URL(result.link).hostname}
                </small>
                <small style={{ color: '#b0b0b0', display: 'block', fontSize: '0.8rem' }}>
                  {result.snippet.substring(0, 90)}...
                </small>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="card-footer text-center" style={{ background: '#1a1a2e', fontSize: '0.75rem', color: '#9945ff' }}>
        Results: {results.length} found
      </div>
    </div>
  );
}
