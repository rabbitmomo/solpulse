'use client';

import React, { useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function BedrockChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/bedrock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userMessage: inputValue }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from Bedrock');
      }

      const data = await response.json();
      
      const assistantContent = data.result?.output?.message?.content?.[0]?.text || 
                               'No response received';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Bedrock API error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="card border-0 shadow-lg h-100">
      <div className="card-header" style={{ background: '#9945ff', borderRadius: '8px 8px 0 0' }}>
        <h5 className="card-title mb-0 text-white">
          Bedrock Chat
        </h5>
        <small className="text-light">Analyze & Clarify Messages</small>
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
        {messages.length === 0 ? (
          <div className="text-center text-secondary py-5">
            <p>Start a conversation with Bedrock AI</p>
            <small>Type a message to get insights and clarifications</small>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-3 ${msg.role === 'user' ? 'text-end' : 'text-start'}`}
              >
                <div
                  style={{
                    display: 'inline-block',
                    maxWidth: '85%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: msg.role === 'user' ? '#14f195' : '#2a2a4e',
                    color: msg.role === 'user' ? '#000' : '#e0e0e0',
                    wordWrap: 'break-word',
                  }}
                >
                  <p className="mb-0" style={{ fontSize: '0.9rem' }}>
                    {msg.content}
                  </p>
                  <small
                    style={{
                      opacity: 0.7,
                      fontSize: '0.75rem',
                      display: 'block',
                      marginTop: '4px',
                    }}
                  >
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </small>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-start">
                <div
                  style={{
                    display: 'inline-block',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#2a2a4e',
                    color: '#9945ff',
                  }}
                >
                  <span>⏳ Thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
        {error && (
          <div className="alert alert-danger mt-3 mb-0" style={{ fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      <div className="card-footer" style={{ background: '#1a1a2e', borderRadius: '0 0 8px 8px' }}>
        <div className="d-flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Bedrock AI..."
            className="form-control"
            style={{
              background: '#2a2a4e',
              border: '1px solid #9945ff',
              color: '#e0e0e0',
            }}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="btn btn-primary"
            style={{ background: '#9945ff', border: 'none' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
