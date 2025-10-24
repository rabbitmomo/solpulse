'use client';

import React, { useState, useEffect } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getProgram } from '@/lib/program';
import { PublicKey } from '@solana/web3.js';

interface VoteProps {
  proposalTitle: string;
  proposalAuthor: PublicKey;
  onVoteSuccess?: () => void;
}

export const Vote: React.FC<VoteProps> = ({ proposalTitle, proposalAuthor, onVoteSuccess }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, sendTransaction } = wallet;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userVote, setUserVote] = useState<'YES' | 'NO' | null>(null);

  useEffect(() => {
    if (publicKey) {
      checkUserVote();
    }
  }, [publicKey, proposalTitle, proposalAuthor]);

  const checkUserVote = async () => {
    try {
      const provider = new anchor.AnchorProvider(connection, wallet as any, {});
      const program = getProgram(provider);

      // Derive proposal PDA
      const [proposalPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('proposal'), proposalAuthor.toBuffer(), Buffer.from(proposalTitle)],
        program.programId
      );

      const proposalAccount = await program.account.proposalAccount.fetch(proposalPDA);

      const voterRecord = proposalAccount.voters.find(
        (v: any) => v.voter.toBase58() === publicKey?.toBase58()
      );

      if (voterRecord) {
        setUserVote(voterRecord.votedYes ? 'YES' : 'NO');
      } else {
        setUserVote(null);
      }
    } catch (err) {
      console.error('Error checking vote:', err);
    }
  };

  const handleVote = async (direction: 'YES' | 'NO') => {
    if (!publicKey) {
      setError('❌ Connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log(`🗳️ Voting ${direction}...`);

      const provider = new anchor.AnchorProvider(connection, wallet as any, {});
      const program = getProgram(provider);

      const [proposalPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('proposal'), proposalAuthor.toBuffer(), Buffer.from(proposalTitle)],
        program.programId
      );

      console.log('📌 Proposal PDA:', proposalPDA.toBase58());

      const voteDirectionEnum = direction === 'YES' ? { yes: {} } : { no: {} };

      // Use Anchor's built-in RPC method for cleaner transaction handling
      console.log('🚀 Sending transaction via Anchor RPC...');
      const signature = await program.methods
        .voteOnProposal(voteDirectionEnum)
        .accounts({
          voter: publicKey,
          proposalAccount: proposalPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log('⏳ Waiting for confirmation...');
      await connection.confirmTransaction(signature, 'confirmed');

      setSuccess(`✅ Vote recorded! TX: ${signature}`);
      setUserVote(direction);
      onVoteSuccess?.();

      setTimeout(() => checkUserVote(), 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // Handle specific vote errors
      if (errorMessage.includes('AlreadyVotedYes')) {
        setError('❌ You already voted YES. Switch your vote with the NO button.');
      } else if (errorMessage.includes('AlreadyVotedNo')) {
        setError('❌ You already voted NO. Switch your vote with the YES button.');
      } else if (errorMessage.includes('ProposalClosed')) {
        setError('❌ This proposal is closed.');
      } else if (errorMessage.includes('ProposalExpired')) {
        setError('❌ This proposal has expired.');
      } else {
        setError(`❌ Error: ${errorMessage}`);
      }
      
      console.error('Voting error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-lg mb-4">
      <div className="card-header">
        <h2 className="card-title mb-0" style={{ color: '#fff' }}>Vote on This Prediction</h2>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {success.includes('TX:') ? (
              <>
                <div className="mb-2">✅ Vote recorded!</div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <small className="text-muted">TX:</small>
                  <a
                    href={`https://explorer.solana.com/tx/${success.split('TX: ')[1]}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none"
                  >
                    <code className="bg-white px-2 py-1 rounded text-success cursor-pointer" style={{ wordBreak: 'break-all', display: 'inline-block', maxWidth: '100%' }}>
                      {success.split('TX: ')[1]}
                    </code>
                  </a>
                </div>
              </>
            ) : (
              success
            )}
          </div>
        )}

        {userVote && (
          <div className="alert alert-info alert-dismissible fade show" role="alert">
            Your vote is locked: <strong>{userVote}</strong>
          </div>
        )}

        <div className="row">
          <div className="col-md-6 mb-2">
            <button
              onClick={() => handleVote('YES')}
              disabled={loading || userVote !== null}
              className={`btn w-100 ${
                userVote === 'YES'
                  ? 'btn-primary'
                  : 'btn-outline-primary'
              }`}
            >
              {loading && userVote === 'YES' ? '⏳ Voting YES...' : 'Vote YES'}
            </button>
          </div>
          <div className="col-md-6 mb-2">
            <button
              onClick={() => handleVote('NO')}
              disabled={loading || userVote !== null}
              className={`btn w-100 ${
                userVote === 'NO'
                  ? 'btn-secondary'
                  : 'btn-outline-secondary'
              }`}
            >
              {loading && userVote === 'NO' ? '⏳ Voting NO...' : 'Vote NO'}
            </button>
          </div>
        </div>

        {!publicKey && (
          <div className="alert alert-warning mt-3 mb-0" role="alert">
            Connect your wallet to vote
          </div>
        )}
      </div>
    </div>
  );
};
