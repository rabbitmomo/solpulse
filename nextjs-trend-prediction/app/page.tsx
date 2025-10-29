'use client';

import React, { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { CreateTrend } from './components/CreateTrend';
import { Vote } from './components/Vote';
import { TrendViewer } from './components/TrendViewer';
import { PredictionsList } from './components/PredictionsList';
import { BedrockChat } from './components/BedrockChat';
import { GoogleSearch } from './components/GoogleSearch';
import { getProgram } from '@/lib/program';

interface ProposalItem {
  title: string;
  author: PublicKey;
  description: string;
  yesVotes: number;
  noVotes: number;
}

export default function Home() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [activeTab, setActiveTab] = useState<'home' | 'create' | 'vote'>('home');
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalAuthor, setProposalAuthor] = useState<PublicKey | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  const fetchAllProposals = async () => {
    setLoadingProposals(true);
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
      setLoadingProposals(false);
    }
  };

  useEffect(() => {
    fetchAllProposals();
  }, [connection, refreshTrigger]);

  const handleSelectPrediction = (proposal: ProposalItem) => {
    setProposalTitle(proposal.title);
    setProposalAuthor(proposal.author);
    setActiveTab('vote');
  };

  const handleCreateClick = () => {
    setActiveTab('create');
  };

  const handleProposalCreated = (title: string) => {
    setProposalTitle(title);
    setProposalAuthor(publicKey);
    setActiveTab('vote');
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleVoteSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLoadProposal = () => {
    if (!proposalTitle || !proposalAuthor) {
      alert('Please enter a prediction title and author address');
    }
  };

  const handleSelectProposal = (proposal: ProposalItem) => {
    setProposalTitle(proposal.title);
    setProposalAuthor(proposal.author);
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="bg-dark text-light" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="bg-dark border-bottom border-secondary sticky-top">
        <div className="container-lg py-4 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <img 
              src="/SolPulse Logo.jpg" 
              alt="SolPulse Logo" 
              style={{ height: '50px', width: 'auto', borderRadius: '8px' }}
            />
            <div>
              <h1 className="h2 text-white mb-0">SolPulse</h1>
              <p className="text-secondary mb-0">On-Chain Sentiment Aggregator for Meme Coins</p>
            </div>
          </div>
          <WalletMultiButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="container-lg py-4">
        {!publicKey ? (
          <div className="alert alert-warning border-start border-4 border-warning mb-4">
            <p className="mb-0">
              🔗 Please connect your wallet to get started
            </p>
          </div>
        ) : null}

        {/* Tabs */}
        <div className="d-flex gap-3 mb-4 flex-wrap">
          <button
            onClick={() => setActiveTab('home')}
            className={`btn ${
              activeTab === 'home'
                ? 'btn-primary'
                : 'btn-outline-secondary'
            }`}
          >
            Explore All
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`btn ${
              activeTab === 'create'
                ? 'btn-primary'
                : 'btn-outline-secondary'
            }`}
          >
            Create Prediction
          </button>
          <button
            onClick={() => setActiveTab('vote')}
            className={`btn ${
              activeTab === 'vote'
                ? 'btn-primary'
                : 'btn-outline-secondary'
            }`}
          >
            Vote & Explore
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'home' && (
            <div className="row g-4">
              <div className="col-lg-8">
                <PredictionsList
                  onSelectPrediction={handleSelectPrediction}
                  onCreateClick={handleCreateClick}
                  refreshTrigger={refreshTrigger}
                />
              </div>
              <div className="col-lg-4 d-flex flex-column gap-3">
                <GoogleSearch />
                <BedrockChat />
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="row g-4">
              <div className="col-lg-8">
                <CreateTrend onProposalCreated={handleProposalCreated} />
              </div>
              <div className="col-lg-4">
                <div className="card bg-secondary border-secondary">
                  <div className="card-body">
                    <h5 className="card-title" style={{ color: '#fff' }}>How SolPulse Works</h5>
                    <div className="text-light" style={{ fontSize: '0.9rem' }}>
                      <p>
                        <strong>1.</strong> Authors post meme coin predictions
                      </p>
                      <p>
                        <strong>2.</strong> Investors vote YES or NO on predictions
                      </p>
                      <p>
                        <strong>3.</strong> Each vote mints confidence tokens
                      </p>
                      <p>
                        <strong>4.</strong> Confidence Index shows market sentiment
                      </p>
                      <p>
                        <strong>5.</strong> Higher index = stronger community belief
                      </p>
                      <p className="text-secondary mt-3 mb-0">
                        SolPulse reveals true investor confidence in predictions!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vote' && (
            <div className="row g-4">
              <div className="col-lg-8">
                <div className="card border-0 shadow-lg mb-4">
                  <div className="card-header">
                    <h5 className="card-title mb-0" style={{ color: '#fff' }}>All Predictions</h5>
                  </div>
                  <div className="card-body">
                    <div>
                      {loadingProposals ? (
                        <div className="alert alert-info">Loading proposals...</div>
                      ) : proposals.length === 0 ? (
                        <div className="alert alert-secondary">No proposals found</div>
                      ) : (
                        <div className="list-group">
                          {proposals.map((proposal, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectProposal(proposal)}
                              className="list-group-item list-group-item-action text-start border-0 mb-2 rounded"
                              style={{ background: '#1a1a2e', border: '1px solid #9945ff', color: '#e0e0e0' }}
                            >
                              <div className="d-flex w-100 justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <h6 className="mb-1 fw-bold" style={{ color: '#14f195' }}>{proposal.title}</h6>
                                  <small className="text-muted d-block text-truncate">
                                    {proposal.author.toBase58().slice(0, 20)}...
                                  </small>
                                  <small style={{ color: '#9945ff' }} className="d-block text-truncate">
                                    {proposal.description.slice(0, 60)}...
                                  </small>
                                </div>
                                <div className="text-end ms-2">
                                  <span className="badge" style={{ background: '#14f195', color: '#000' }}>✅ {proposal.yesVotes}</span>
                                  <span className="badge ms-1" style={{ background: '#9945ff', color: '#fff' }}>❌ {proposal.noVotes}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleRefresh}
                      className="btn btn-outline-secondary w-100 mt-3"
                    >
                      Refresh Data
                    </button>
                  </div>
                </div>

                {proposalTitle && proposalAuthor && (
                  <>
                    <TrendViewer
                      proposalTitle={proposalTitle}
                      proposalAuthor={proposalAuthor}
                      refreshTrigger={refreshTrigger}
                    />
                    <Vote 
                      proposalTitle={proposalTitle}
                      proposalAuthor={proposalAuthor}
                      onVoteSuccess={handleVoteSuccess}
                    />
                  </>
                )}
              </div>

              <div className="col-lg-4">
                <div className="card border-0 shadow-lg mb-4">
                  <div className="card-header">
                    <h5 className="card-title mb-0" style={{ color: '#fff' }}>Find a Prediction</h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-4">
                      <div>
                        <div className="mb-3">
                          <label className="fw-bold" style={{ color: '#fff !important' }}>
                            Prediction Title
                          </label>
                          <input
                            type="text"
                            value={proposalTitle}
                            onChange={(e) => setProposalTitle(e.target.value)}
                            placeholder="eg: $SHIB Will Pump 2x"
                            className="form-control"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="fw-bold" style={{ color: '#fff !important' }}>
                            Prediction Author Address
                          </label>
                          <input
                            type="text"
                            value={proposalAuthor?.toBase58() || ''}
                            onChange={(e) => {
                              try {
                                setProposalAuthor(new PublicKey(e.target.value));
                              } catch {
                                // Invalid address
                              }
                            }}
                            placeholder="Solana address"
                            className="form-control"
                          />
                          <small className="text-muted d-block mt-2">
                            Enter the public key of the prediction author
                          </small>
                        </div>
                      </div>
                      <button
                        onClick={handleLoadProposal}
                        className="btn btn-primary w-100"
                      >
                        Load Prediction
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card bg-secondary border-secondary">
                  <div className="card-body">
                    <h5 className="card-title" style={{ color: '#fff' }}>SolPulse Guide</h5>
                    <div className="text-light" style={{ fontSize: '0.9rem' }}>
                      <p>
                        <strong>1.</strong> Enter prediction title and author
                      </p>
                      <p>
                        <strong>2.</strong> Click "Load Prediction" to view details
                      </p>
                      <p>
                        <strong>3.</strong> Click YES or NO to vote
                      </p>
                      <p>
                        <strong>4.</strong> You can change your vote anytime
                      </p>
                      <p>
                        <strong>5.</strong> Confidence Index shows market consensus
                      </p>
                      <hr className="border-secondary" />
                      <p className="text-secondary mb-0">
                        Each vote = 1 confidence token
                      </p>
                      <p className="text-secondary mb-0">
                        Index: 0% = split, 100% = unanimous
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card bg-info border-info mt-3">
                  <div className="card-body">
                    <h6 className="card-title mb-2" style={{ color: '#fff' }}>Confidence Index</h6>
                    <div className="text-white" style={{ fontSize: '0.85rem' }}>
                      <p className="mb-1" style={{ color: '#14f195' }}><strong>100%:</strong> All votes same</p>
                      <p className="mb-1" style={{ color: '#14f195' }}><strong>50%:</strong> Moderate consensus</p>
                      <p className="mb-0" style={{ color: '#14f195' }}><strong>0%:</strong> Perfect split</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="card bg-secondary border-secondary mt-5">
          <div className="card-body text-center">
            <p className="text-light mb-1">
              Program ID: <code className="bg-dark px-2 py-1 rounded text-warning">D9ZvX3tLKzCEhX6HM4FAdFsJnpqewW6canG5UJAfrAU5</code>
            </p>
            <p className="text-secondary mb-0">Network: Solana Devnet | SolPulse - On-Chain Sentiment Aggregator</p>
          </div>
        </div>
      </main>
    </div>
  );
}
