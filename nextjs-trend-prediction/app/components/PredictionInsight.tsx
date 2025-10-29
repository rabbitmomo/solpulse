'use client';

import React, { useState } from 'react';

interface InsightResult {
  forumResults: Array<{
    title: string;
    link: string;
    snippet: string;
    domain: string;
  }>;
  bedrockAnalysis: string;
  confidenceAssessment: string;
}

interface PredictionInsightProps {
  title: string;
  description: string;
  confidenceIndex: number;
}

export const PredictionInsight: React.FC<PredictionInsightProps> = ({
  title,
  description,
  confidenceIndex,
}) => {
  const [insight, setInsight] = useState<InsightResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInsight, setShowInsight] = useState(false);

  const generateInsight = async () => {
    setIsLoading(true);
    setError(null);
    setInsight(null);

    try {
      console.log('🔍 Searching forum discussions...');
      const searchResponse = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: title }),
      });

      if (!searchResponse.ok) {
        throw new Error('Failed to search forum discussions');
      }

      const searchData = await searchResponse.json();
      const forumResults = searchData.results || [];

      console.log('📝 Forum results:', forumResults.length);

      const discussionSnippets = forumResults
        .slice(0, 3)
        .map((r: any) => `• ${r.domain}: ${r.snippet.substring(0, 80)}`)
        .join('\n');

      const analysisPrompt = `${title}
Confidence: ${confidenceIndex}%

Forums: ${discussionSnippets || 'None'}

Answer with 4 lines ONLY. Start each line with a dash:
- Sentiment: (bullish/bearish/mixed)
- Justification: (yes/no/partially) and 3-sentence reason (limited to 50 words)
- Likelihood: (high/medium/low)
- Risk: (high/medium/low)`;

      const bedrockResponse = await fetch('/api/bedrock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage: analysisPrompt }),
      });

      if (!bedrockResponse.ok) {
        throw new Error('Failed to get analysis from Bedrock');
      }

      const bedrockData = await bedrockResponse.json();
      const bedrockAnalysis =
        bedrockData.result?.output?.message?.content?.[0]?.text ||
        'Unable to generate analysis';

      let confidenceAssessment = '';
      if (confidenceIndex < 20) {
        confidenceAssessment =
          '⚠️ LOW CONSENSUS: Weak agreement. Community sentiment appears mixed or uncertain.';
      } else if (confidenceIndex < 50) {
        confidenceAssessment =
          '📊 MODERATE CONSENSUS: Some agreement, but significant disagreement remains.';
      } else if (confidenceIndex < 80) {
        confidenceAssessment =
          '✓ STRONG CONSENSUS: Community shows clear agreement on this prediction.';
      } else {
        confidenceAssessment =
          '✅ VERY STRONG CONSENSUS: Community strongly believes in this prediction.';
      }

      setInsight({
        forumResults: forumResults.slice(0, 3),
        bedrockAnalysis,
        confidenceAssessment,
      });
      setShowInsight(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Insight generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card shadow-lg mb-4" style={{ background: '#1a1a2e', border: '1px solid #9945ff' }}>
      <div className="card-header" style={{ background: '#9945ff' }}>
        <h5 className="mb-0" style={{color:'white'}}>Bedrock Insight</h5>
        <small className="text-light">Analyze forum discussions & assess confidence</small>
      </div>

      <div className="card-body">
        {!showInsight && !isLoading && !error && (
          <div className="text-center">
            <p className="text-muted mb-3">
              Get AI-powered analysis of community discussions to assess whether the confidence index is justified.
            </p>
            <button
              onClick={generateInsight}
              disabled={isLoading}
              className="btn btn-primary"
              style={{ background: '#9945ff', border: 'none' }}
            >
              Generate Insight
            </button>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-4">
            <p className="text-muted mb-2">⏳ Analyzing community discussions...</p>
            <div className="spinner-border spinner-border-sm" style={{ color: '#9945ff' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-danger mb-0">
            <p className="mb-1">❌ Error: {error}</p>
            <button
              onClick={() => setShowInsight(false)}
              className="btn btn-sm btn-outline-danger"
            >
              Try Again
            </button>
          </div>
        )}

        {showInsight && insight && (
          <div className="space-y-3">
            {/* Confidence Assessment */}
            <div
              className="p-3 rounded"
              style={{ background: 'rgba(153, 69, 255, 0.1)', border: '1px solid #9945ff' }}
            >
              <p className="small fw-bold mb-2" style={{ color: '#9945ff' }}>
                Confidence Assessment
              </p>
              <p className="small mb-0" style={{ color: '#e0e0e0' }}>
                {insight.confidenceAssessment}
              </p>
            </div>

            {/* Bedrock Analysis */}
            <div
              className="p-3 rounded"
              style={{ background: 'rgba(20, 241, 149, 0.08)', border: '1px solid rgba(20, 241, 149, 0.3)' }}
            >
              <p className="small fw-bold mb-2" style={{ color: '#14f195' }}>
                Bedrock Insight
              </p>
              <div className="small" style={{ color: '#e0e0e0', lineHeight: '1.6' }}>
                {insight.bedrockAnalysis.split('\n').map((line, idx) => {
                  if (line.startsWith('-')) {
                    return (
                      <p key={idx} className="mb-2 ms-2">
                        <span style={{ color: '#14f195' }}>•</span> {line.substring(1).trim()}
                      </p>
                    );
                  }
                  return line.trim() ? (
                    <p key={idx} className="mb-2">
                      {line}
                    </p>
                  ) : null;
                })}
              </div>
            </div>

            {/* Forum Results */}
            {insight.forumResults.length > 0 && (
              <div className="p-3 rounded" style={{ background: '#2a2a4e', border: '1px solid #14f195' }}>
                <p className="small fw-bold mb-2" style={{ color: '#14f195' }}>
                  Top Forum Discussions
                </p>
                <div className="space-y-2">
                  {insight.forumResults.map((result, idx) => (
                    <a
                      key={idx}
                      href={result.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none d-block p-2 rounded"
                      style={{
                        background: '#1a1a2e',
                        border: '1px solid #14f19533',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#3a3a5e';
                        e.currentTarget.style.borderColor = '#14f195';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#1a1a2e';
                        e.currentTarget.style.borderColor = '#14f19533';
                      }}
                    >
                      <h6 className="mb-1" style={{ color: '#14f195', fontSize: '0.85rem' }}>
                        {result.title}
                      </h6>
                      <small style={{ color: '#9945ff', display: 'block', marginBottom: '4px' }}>
                        {result.domain}
                      </small>
                      <small style={{ color: '#b0b0b0', fontSize: '0.75rem' }}>
                        {result.snippet.substring(0, 80)}...
                      </small>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInsight(false)}
              className="btn btn-sm btn-outline-secondary w-100"
            >
              Close Insight
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
