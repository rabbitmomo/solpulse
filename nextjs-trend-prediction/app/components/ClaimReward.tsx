'use client';

import React, { useState } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getProgram } from '@/lib/program';

interface ClaimRewardProps {
  trendAddress: string;
  onRewardClaimed?: () => void;
}

export const ClaimReward: React.FC<ClaimRewardProps> = ({
  trendAddress,
  onRewardClaimed,
}) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!publicKey) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create a simple wallet object for the provider
      const wallet = {
        publicKey,
        signTransaction: async (tx: anchor.web3.Transaction) => tx,
        signAllTransactions: async (txs: anchor.web3.Transaction[]) => txs,
      };

      const provider = new anchor.AnchorProvider(connection, wallet as any, {});
      const program = getProgram(provider);

      const trendPDA = new PublicKey(trendAddress);

      const tx = await program.methods
        .claimReward()
        .accounts({
          voter: publicKey,
          trendAccount: trendPDA,
        })
        .transaction();

      // Get the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = publicKey;

      // Use wallet adapter's sendTransaction which handles signing and sending
      const signature = await sendTransaction(tx, connection);

      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      setSuccess(`✅ Reward claimed successfully! Tx: ${signature}`);

      if (onRewardClaimed) {
        onRewardClaimed();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`❌ Error: ${errorMessage}`);
      console.error('Claim reward error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-lg mb-4">
      <div className="card-header">
        <h2 className="card-title mb-0">Claim Reward</h2>
      </div>
      <div className="card-body">
        <p className="text-muted mb-3">
          Trend Address: <code className="px-2 py-1 rounded">{trendAddress}</code>
        </p>

        <div className="alert alert-info" role="alert">
          <p className="mb-0">
            ℹ️ If you voted on the winning side, click the button below to claim your reward tokens!
          </p>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {success.includes('Tx:') ? (
              <>
                <div className="mb-2">✅ Reward claimed!</div>
                <div>
                  <small className="text-muted">TX: </small>
                  <a
                    href={`https://explorer.solana.com/tx/${success.split('Tx: ')[1]}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none"
                  >
                    <code className="bg-white px-2 py-1 rounded text-success cursor-pointer">{success.split('Tx: ')[1]}</code>
                  </a>
                </div>
              </>
            ) : (
              success
            )}
          </div>
        )}

        <button
          onClick={handleClaim}
          disabled={loading}
          className="btn btn-secondary w-100"
        >
          {loading ? '⏳ Claiming...' : 'Claim My Reward'}
        </button>
      </div>
    </div>
  );
};
