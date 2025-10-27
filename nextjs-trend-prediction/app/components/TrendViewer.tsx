'use client';

import React, { useState, useEffect } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getProgram } from '@/lib/program';
import { PredictionInsight } from './PredictionInsight';

interface ProposalViewerProps {
  proposalTitle: string;
  proposalAuthor: PublicKey;
  refreshTrigger?: number;
}

interface ProposalData {
  author: PublicKey;
  title: string;
  description: string;
  tokenAddress: PublicKey;
  createdAt: number;
  expirationTime: number;
  yesVotes: number;
  noVotes: number;
  uniqueVoters: number;
  voters: any[];
  closed: boolean;
  outcome: any;
}

export const TrendViewer: React.FC<ProposalViewerProps> = ({
  proposalTitle,
  proposalAuthor,
  refreshTrigger = 0,
}) => {
  const { connection } = useConnection();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proposalPDA, setProposalPDA] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposal = async () => {
      setLoading(true);
      setError(null);

      try {
        const provider = new anchor.AnchorProvider(connection, {} as any, {});
        const program = getProgram(provider);

        const [pda] = PublicKey.findProgramAddressSync(
          [Buffer.from('proposal'), proposalAuthor.toBuffer(), Buffer.from(proposalTitle)],
          program.programId
        );

        console.log('📌 Fetching proposal from PDA:', pda.toBase58());
        setProposalPDA(pda.toBase58());

        const proposalAccount = await program.account.proposalAccount.fetch(pda);

        const formattedProposal: ProposalData = {
          author: proposalAccount.author,
          title: proposalAccount.title,
          description: proposalAccount.description,
          tokenAddress: proposalAccount.tokenAddress,
          createdAt: typeof proposalAccount.createdAt === 'number' ? proposalAccount.createdAt : proposalAccount.createdAt.toNumber(),
          expirationTime: typeof proposalAccount.expirationTime === 'number' ? proposalAccount.expirationTime : proposalAccount.expirationTime.toNumber(),
          yesVotes: typeof proposalAccount.yesVotes === 'number' ? proposalAccount.yesVotes : proposalAccount.yesVotes.toNumber(),
          noVotes: typeof proposalAccount.noVotes === 'number' ? proposalAccount.noVotes : proposalAccount.noVotes.toNumber(),
          uniqueVoters: typeof proposalAccount.uniqueVoters === 'number' ? proposalAccount.uniqueVoters : proposalAccount.uniqueVoters.toNumber(),
          voters: proposalAccount.voters,
          closed: proposalAccount.closed,
          outcome: proposalAccount.outcome,
        };

        setProposal(formattedProposal);
      } catch (err) {
        setError(
          `❌ Error fetching proposal: ${err instanceof Error ? err.message : String(err)}`
        );
        console.error('Proposal fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (proposalTitle && proposalAuthor) {
      fetchProposal();
    }
  }, [proposalTitle, proposalAuthor, connection, refreshTrigger]);

  if (loading) {
    return (
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <p className="text-center text-muted">⏳ Loading proposal data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
        {error}
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="alert alert-warning alert-dismissible fade show mb-4" role="alert">
        ⚠️ Proposal not found
      </div>
    );
  }

  const totalVotes = proposal.yesVotes + proposal.noVotes;
  const yesPercentage = totalVotes > 0 ? (proposal.yesVotes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (proposal.noVotes / totalVotes) * 100 : 0;

  const confidenceIndex =
    totalVotes > 0 ? (Math.abs(proposal.yesVotes - proposal.noVotes) / totalVotes) * 100 : 0;

  const now = Math.floor(Date.now() / 1000);
  const timeRemaining = proposal.expirationTime - now;
  const isExpired = timeRemaining <= 0;
  const hoursRemaining = Math.ceil(timeRemaining / 3600);

  let outcomeText = 'Not Closed';
  if (proposal.closed && proposal.outcome) {
    if (proposal.outcome.yesWins) {
      outcomeText = '✅ YES WINS';
    } else if (proposal.outcome.noWins) {
      outcomeText = '❌ NO WINS';
    } else if (proposal.outcome.tied) {
      outcomeText = '🤝 TIED';
    }
  }

  return (
    <div className="card shadow-lg mb-4">
      <div className="card-header">
        <h2 className="card-title mb-0" style={{ color: '#fff' }}>Prediction Details</h2>
      </div>
      <div className="card-body">
        <div className="space-y-4">

          <div className="border-bottom pb-3 mb-3">
            <p className="small text-muted">Title</p>
            <p className="fw-bold" style={{ color: '#14f195' }}>{proposal.title}</p>
          </div>

        <div className="border-bottom pb-3 mb-3">
          <p className="small text-muted">Description</p>
          <p style={{ color: '#14f195' }} className="fw-bold">{proposal.description}</p>
        </div>

        <div className="row">
          <div className="col-6 col-md-6">
            <p className="small text-muted">Token Address</p>
            <p className="small font-monospace" style={{ color: '#14f195' }}>{proposal.tokenAddress.toBase58().slice(0, 20)}...</p>
          </div>
          <div className="col-6 col-md-6">
            <p className="small text-muted">Created</p>
            <p className="small" style={{ color: '#14f195' }}>
              {new Date(proposal.createdAt * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="alert alert-info mb-3" role="alert">
          <p className="small fw-bold mb-2">Time Status</p>
          {isExpired ? (
            <p className="small mb-0">Expired</p>
          ) : (
            <p className="small mb-0">
              {hoursRemaining} hours remaining until expiration
            </p>
          )}
        </div>

        <div className="border-top pt-3 mb-3">
          <p className="small text-muted fw-bold mb-3">Voting Results</p>

          <div className="mb-3 p-3 rounded" style={{ background: 'rgba(20, 241, 149, 0.08)', border: '1px solid rgba(20, 241, 149, 0.3)' }}>
            <div className="d-flex justify-content-between mb-2">
              <span className="small fw-bold" style={{ color: '#14f195' }}>YES: {proposal.yesVotes}</span>
              <span className="small fw-medium" style={{ color: '#14f195' }}>{yesPercentage.toFixed(1)}%</span>
            </div>
            <div className="progress" style={{ height: '8px' }}>
              <div
                className="progress-bar"
                style={{ width: `${yesPercentage}%`, background: 'linear-gradient(90deg, #14f195 0%, #2eff99 100%)' }}
              />
            </div>
          </div>

          <div className="mb-3 p-3 rounded" style={{ background: 'rgba(153, 69, 255, 0.08)', border: '1px solid rgba(153, 69, 255, 0.3)' }}>
            <div className="d-flex justify-content-between mb-2">
              <span className="small fw-bold" style={{ color: '#9945ff' }}>NO: {proposal.noVotes}</span>
              <span className="small fw-medium" style={{ color: '#9945ff' }}>{noPercentage.toFixed(1)}%</span>
            </div>
            <div className="progress" style={{ height: '8px' }}>
              <div
                className="progress-bar"
                style={{ width: `${noPercentage}%`, background: 'linear-gradient(90deg, #9945ff 0%, #b365ff 100%)' }}
              />
            </div>
          </div>

                    <div className="d-flex justify-content-between align-items-center p-3 rounded mb-3" style={{ background: '#1a1a2e', border: '1px solid #9945ff' }}>
            <p className="small text-muted mb-0">Total Unique Voters:</p>
            <span className="fw-bold">{proposal.uniqueVoters}</span>
          </div>
        </div>

        <div className="p-3 rounded mb-3" style={{ background: 'rgba(153, 69, 255, 0.1)', border: '1px solid #9945ff' }}>
          <p className="small fw-bold mb-2">Confidence Index</p>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#14f195' }}>{confidenceIndex.toFixed(1)}%</p>
            <p className="small text-end" style={{ color: '#14f195' }}>
              Higher = stronger consensus
            </p>
          </div>
          <div className="progress">
            <div
              className="progress-bar"
              style={{ width: `${confidenceIndex}%`, background: 'linear-gradient(90deg, #9945ff 0%, #14f195 100%)' }}
            />
          </div>
        </div>

        {proposal.closed && (
          <div className="p-3 rounded mb-3" style={{ background: 'rgba(20, 241, 149, 0.1)', border: '1px solid #14f195' }}>
            <p className="small fw-bold mb-1" style={{ color: '#14f195' }}>Status: CLOSED</p>
            <p className="mb-0 fw-bold" style={{ color: '#14f195' }}>{outcomeText}</p>
          </div>
        )}

        <PredictionInsight
          title={proposal.title}
          description={proposal.description}
          confidenceIndex={confidenceIndex}
        />

        <div className="border-top pt-3">
          <div className="mb-3">
            <p className="small text-muted mb-2">Author</p>
            <p className="small font-monospace" style={{ color: '#14f195' }}>
              {proposal.author.toBase58().slice(0, 20)}...
            </p>
          </div>
          
          {proposalPDA && (
            <div className="mb-3">
              <p className="small text-muted mb-2">📌 PDA Address (On-Chain)</p>
              <p className="small text-muted mb-2" style={{ fontSize: '0.75rem' }}>Derived from: [proposal, author, title]</p>
              <a
                href={`https://explorer.solana.com/address/${proposalPDA}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-success w-100 text-start"
                style={{ fontSize: '0.85rem', padding: '8px 12px', wordBreak: 'break-all' }}
              >
                Program Derived Address: {proposalPDA} →
              </a>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};
