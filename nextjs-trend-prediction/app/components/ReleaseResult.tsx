'use client';

import React, { useState } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getProgram } from '@/lib/program';

interface ReleaseResultProps {
  trendAddress: string;
  onResultReleased?: () => void;
}

export const ReleaseResult: React.FC<ReleaseResultProps> = ({
  trendAddress,
  onResultReleased,
}) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [resultData, setResultData] = useState({
    winningSide: 'true',
    rewardPool: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setResultData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRelease = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicKey) {
      setError('Please connect your wallet');
      return;
    }

    if (!resultData.rewardPool) {
      setError('Please enter reward pool amount');
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
      const winningSide = resultData.winningSide === 'true';

      const tx = await program.methods
        .releaseResult(winningSide, new anchor.BN(resultData.rewardPool))
        .accounts({
          creator: publicKey,
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

      setSuccess(
        `✅ Result released! ${winningSide ? 'YES' : 'NO'} side won! Tx: ${signature}`
      );
      setResultData({
        winningSide: 'true',
        rewardPool: '',
      });

      if (onResultReleased) {
        onResultReleased();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`❌ Error: ${errorMessage}`);
      console.error('Release result error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-lg mb-4">
      <div className="card-header">
        <h2 className="card-title mb-0">Release Result</h2>
      </div>
      <div className="card-body">
        <p className="text-muted mb-4">
          Trend Address: <code className="px-2 py-1 rounded">{trendAddress}</code>
        </p>

        <form onSubmit={handleRelease}>
          <div className="mb-3">
            <label className="form-label fw-bold">Winning Side</label>
            <select
              name="winningSide"
              value={resultData.winningSide}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="true">✅ YES Side Wins</option>
              <option value="false">❌ NO Side Wins</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Total Reward Pool</label>
            <input
              type="number"
              name="rewardPool"
              value={resultData.rewardPool}
              onChange={handleInputChange}
              placeholder="e.g., 1000000"
              className="form-control"
            />
            <small className="text-muted d-block mt-1">
              Total tokens to distribute among winners
            </small>
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
                  <div className="mb-2">✅ Result released!</div>
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
            type="submit"
            disabled={loading}
            className="btn btn-primary w-100"
          >
            {loading ? '⏳ Releasing...' : 'Release Result'}
          </button>
        </form>
      </div>
    </div>
  );
};
