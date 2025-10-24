'use client';

import React, { useState, useEffect } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getProgram } from '@/lib/program';
import { PublicKey } from '@solana/web3.js';

interface CreateProposalProps {
  onProposalCreated?: (title: string) => void;
}

export const CreateTrend: React.FC<CreateProposalProps> = ({ onProposalCreated }) => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, sendTransaction } = wallet;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tokenAddress: '',
    durationDays: '7',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!publicKey) {
      setError('❌ Please connect your wallet');
      return;
    }

    if (!formData.title || !formData.description || !formData.durationDays) {
      setError('❌ Please fill in Title, Description, and Duration');
      return;
    }

    if (formData.title.length > 32) {
      setError('❌ Title must be 32 characters or less (PDA seed limit)');
      return;
    }

    if (formData.description.length > 500) {
      setError('❌ Description must be 500 characters or less');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('📝 Creating proposal...');
      
      const provider = new anchor.AnchorProvider(connection, wallet as any, {});
      const program = getProgram(provider);

      const now = Math.floor(Date.now() / 1000);
      const durationSeconds = parseInt(formData.durationDays) * 24 * 60 * 60;
      const expirationTime = now + durationSeconds;

      const DEFAULT_TOKEN = 'So11111111111111111111111111111111111111112';
      
      const addressToUse = formData.tokenAddress.trim() || DEFAULT_TOKEN;
      const tokenAddress = new PublicKey(addressToUse);

      // Derive proposal PDA
      const [proposalPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('proposal'),
          publicKey.toBuffer(),
          Buffer.from(formData.title),
        ],
        program.programId
      );

      console.log('📌 Proposal PDA:', proposalPDA.toBase58());
      console.log('📋 Title:', formData.title);
      console.log('📝 Description:', formData.description);
      console.log('🪙 Token:', tokenAddress.toBase58());
      console.log('⏰ Expires:', new Date(expirationTime * 1000).toISOString());

      console.log('🚀 Sending transaction via Anchor RPC...');
      const signature = await program.methods
        .createProposal(
          formData.title,
          formData.description,
          tokenAddress,
          new anchor.BN(expirationTime)
        )
        .accounts({
          author: publicKey,
          proposalAccount: proposalPDA,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log('⏳ Waiting for confirmation...');
      await connection.confirmTransaction(signature, 'confirmed');

      const successMessage = `✅ Proposal created!\nTX: ${signature}\nTrend ID: ${proposalPDA.toBase58()}`;
      setSuccess(successMessage);
      setFormData({ title: '', description: '', tokenAddress: '', durationDays: '7' });
      onProposalCreated?.(formData.title);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('❌ Full error details:', err);
      console.error('❌ Error message:', errorMessage);
      
      if (errorMessage.includes('already been processed')) {
        setError('✅ This prediction was already created! A prediction with this title already exists.');
      } else if (err && typeof err === 'object' && 'logs' in err) {
        console.error('❌ Transaction logs:', (err as any).logs);
        setError(`❌ Error: ${errorMessage}`);
      } else {
        setError(`❌ Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-lg">
      <div className="card-header">
        <h2 className="card-title mb-0" style={{ color: '#fff' }}>Create Prediction</h2>
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
                <div className="mb-4">
                  <h5 className="text-success mb-3">✅ Proposal created successfully!</h5>
                </div>
                <div className="mb-3">
                  <div className="mb-2">
                    <small className="text-muted d-block mb-2">📌 <strong>Trend ID (On-Chain Address)</strong>:</small>
                    <a
                      href={`https://explorer.solana.com/address/${success.split('Trend ID: ')[1]}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-success w-100 text-start"
                      style={{ fontSize: '0.9rem', wordBreak: 'break-all', padding: '8px 12px' }}
                    >
                      {success.split('Trend ID: ')[1]} →
                    </a>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="mb-2">
                    <small className="text-muted d-block mb-2">🔗 <strong>View Transaction</strong>:</small>
                    <a
                      href={`https://explorer.solana.com/tx/${success.split('TX: ')[1].split('\n')[0]}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-success w-100 text-start"
                      style={{ fontSize: '0.9rem', wordBreak: 'break-all', padding: '8px 12px' }}
                    >
                      {success.split('TX: ')[1].split('\n')[0]} →
                    </a>
                  </div>
                </div>
              </>
            ) : (
              success
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="title" className="form-label fw-bold">
              Title
            </label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., $SHIB Will Pump 2x"
              maxLength={32}
              className="form-control"
            />
            <small className="text-muted">{formData.title.length}/32 characters</small>
          </div>

          <div className="mb-3">
            <label htmlFor="description" className="form-label fw-bold">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Full reasoning for your prediction..."
              maxLength={500}
              rows={4}
              className="form-control"
            />
            <small className="text-muted">{formData.description.length}/500 characters</small>
          </div>

          <div className="mb-3">
            <label htmlFor="tokenAddress" className="form-label fw-bold">
              Token Address <span style={{ color: '#14f195' }}>(Optional)</span>
            </label>
            <input
              id="tokenAddress"
              type="text"
              name="tokenAddress"
              value={formData.tokenAddress}
              onChange={handleInputChange}
              placeholder="Token mint address (leave blank for Wrapped SOL)"
              className="form-control"
            />
            <small className="text-muted">Default: So11111111111111111111111111111111111111112 (Wrapped SOL)</small>
          </div>

          <div className="mb-3">
            <label htmlFor="durationDays" className="form-label fw-bold">
              Voting Duration (Days)
            </label>
            <input
              id="durationDays"
              type="number"
              name="durationDays"
              value={formData.durationDays}
              onChange={handleInputChange}
              min="1"
              max="90"
              className="form-control"
            />
            <small className="text-muted">1-90 days</small>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-100"
          >
            {loading ? '⏳ Creating...' : 'Create Prediction'}
          </button>
        </form>
      </div>
    </div>
  );
};
