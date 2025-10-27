'use client';

import React, { useState, useEffect } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getProgram } from '@/lib/program';

interface ProposalItem {
  title: string;
  author: PublicKey;
  description: string;
  yesVotes: number;
  noVotes: number;
}

interface PredictionsListProps {
  onSelectPrediction: (proposal: ProposalItem) => void;
  onCreateClick: () => void;
  refreshTrigger?: number;
}

export const PredictionsList: React.FC<PredictionsListProps> = ({
  onSelectPrediction,
  onCreateClick,
  refreshTrigger = 0,
}) => {
  const { connection } = useConnection();
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllProposals = async () => {
      setLoading(true);
      try {
        const provider = new anchor.AnchorProvider(connection, {} as any, {});
        const program = getProgram(provider);

        const allAccounts = await program.account.proposalAccount.all();

        const proposalList: ProposalItem[] = allAccounts.map((account: any) => ({
          title: account.account.title,
          author: account.account.author,
          description: account.account.description,
          yesVotes: typeof account.account.yesVotes === 'number'
            ? account.account.yesVotes
            : account.account.yesVotes.toNumber(),
          noVotes: typeof account.account.noVotes === 'number'
            ? account.account.noVotes
            : account.account.noVotes.toNumber(),
        }));

        setProposals(proposalList);
      } catch (err) {
        console.error('Error fetching proposals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllProposals();
  }, [connection, refreshTrigger]);

  return (
    <div className="container-lg py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 text-white mb-1">All Predictions</h1>
          <p className="text-secondary mb-0">Explore meme coin predictions and vote on your favorites</p>
        </div>
        <button
          onClick={onCreateClick}
          className="btn btn-primary"
          style={{ background: 'linear-gradient(135deg, #9945ff 0%, #6a4c93 100%)' }}
        >
          New Prediction
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-secondary mt-3">Loading predictions...</p>
        </div>
      ) : proposals.length === 0 ? (
        <div className="card bg-dark border-secondary">
          <div className="card-body text-center py-5">
            <h5 className="text-secondary mb-3">No Predictions Yet</h5>
            <p className="text-muted mb-3">Be the first to create a prediction!</p>
            <button
              onClick={onCreateClick}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #9945ff 0%, #6a4c93 100%)' }}
            >
              Create First Prediction
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {proposals.map((proposal, idx) => {
            const totalVotes = proposal.yesVotes + proposal.noVotes;
            const yesPercentage = totalVotes > 0 ? (proposal.yesVotes / totalVotes) * 100 : 0;
            
            return (
              <div key={idx} className="col-12 col-sm-6 col-lg-4">
                <button
                  onClick={() => onSelectPrediction(proposal)}
                  className="card h-100 border-0 text-start w-100"
                  style={{
                    background: '#1a1a2e',
                    border: '2px solid #9945ff',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    borderRadius: '12px',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#14f195';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(20, 241, 149, 0.25)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#9945ff';
                    (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  <div className="card-body d-flex flex-column" style={{ minHeight: '280px' }}>
                    {/* Title */}
                    <h6 className="card-title fw-bold mb-3" style={{ color: '#14f195', fontSize: '1rem', lineHeight: '1.3' }}>
                      {proposal.title}
                    </h6>

                    {/* Description */}
                    <p className="card-text text-muted small mb-3 flex-grow-1" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                      {proposal.description.slice(0, 70)}...
                    </p>

                    {/* Author */}
                    <div className="mb-3 pb-2 border-bottom border-secondary">
                      <small className="text-muted">
                        <span style={{ color: '#14f195' }}>Author:</span> {proposal.author.toBase58().slice(0, 10)}...
                      </small>
                    </div>

                    {/* Vote Progress Bar */}
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-2">
                        <small className="fw-bold" style={{ color: '#14f195' }}>YES</small>
                        <small className="fw-bold" style={{ color: '#14f195' }}>{yesPercentage.toFixed(0)}%</small>
                      </div>
                      <div className="progress" style={{ height: '6px', background: 'rgba(153, 69, 255, 0.2)' }}>
                        <div
                          className="progress-bar"
                          style={{
                            width: `${yesPercentage}%`,
                            background: 'linear-gradient(90deg, #14f195 0%, #2eff99 100%)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Vote Counts */}
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <span
                          className="badge me-2 fw-bold"
                          style={{ background: '#14f195', color: '#000', fontSize: '0.85rem', padding: '6px 10px' }}
                        >
                          YES {proposal.yesVotes}
                        </span>
                        <span
                          className="badge fw-bold"
                          style={{ background: '#9945ff', color: '#fff', fontSize: '0.85rem', padding: '6px 10px' }}
                        >
                          NO {proposal.noVotes}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {proposals.length > 0 && (
        <div className="text-center mt-4">
          <button
            onClick={() => window.location.reload()}
            className="btn btn-outline-secondary"
          >
            Refresh Data
          </button>
        </div>
      )}
    </div>
  );
};
