import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import IDL from './idl.json';

export const PROGRAM_ID = new PublicKey('D9ZvX3tLKzCEhX6HM4FAdFsJnpqewW6canG5UJAfrAU5');

// DAO Proposal Types
export interface ProposalAccount {
  author: PublicKey;
  title: string;
  description: string;
  tokenAddress: PublicKey;
  createdAt: anchor.BN;
  expirationTime: anchor.BN;
  yesVotes: anchor.BN;
  noVotes: anchor.BN;
  uniqueVoters: anchor.BN;
  voters: VoterRecord[];
  closed: boolean;
  outcome: ProposalOutcome | null;
}

export interface VoterRecord {
  voter: PublicKey;
  votedYes: boolean;
  votedNo: boolean;
}

export interface ProposalOutcome {
  yesWins?: boolean;
  noWins?: boolean;
  tied?: boolean;
}

export enum VoteDirection {
  Yes = 'Yes',
  No = 'No',
}

// Legacy Types (for backwards compatibility)
export interface TrendAccount {
  creator: PublicKey;
  description: string;
  currentPrice: anchor.BN;
  targetPrice: anchor.BN;
  targetTime: anchor.BN;
  totalYes: anchor.BN;
  totalNo: anchor.BN;
  voteCount: number;
  votes: VoteRecord[];
  resultReleased: boolean;
  winningSide: boolean | null;
  totalRewardPool: anchor.BN;
}

export interface VoteRecord {
  voter: PublicKey;
  yesAmount: anchor.BN;
  noAmount: anchor.BN;
  rewardClaimed: boolean;
}

// DAO Helper Functions
export const getProposalPDA = (
  author: PublicKey,
  title: string
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('proposal'), author.toBuffer(), Buffer.from(title)],
    PROGRAM_ID
  );
};

export const calculateConfidenceIndex = (yesVotes: number, noVotes: number): number => {
  const totalVotes = yesVotes + noVotes;
  if (totalVotes === 0) return 0;
  return (Math.abs(yesVotes - noVotes) / totalVotes) * 100;
};

export const getProposalOutcomeText = (outcome: ProposalOutcome | null): string => {
  if (!outcome) return 'Not Closed';
  if ('yesWins' in outcome) return '✅ YES WINS';
  if ('noWins' in outcome) return '❌ NO WINS';
  if ('tied' in outcome) return '🤝 TIED';
  return 'Unknown';
};

export const formatTimeRemaining = (expirationTime: number): string => {
  const now = Math.floor(Date.now() / 1000);
  const remaining = expirationTime - now;
  
  if (remaining <= 0) return 'Expired';
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
};

// Legacy Helper (for backwards compatibility)
export const getTrendPDA = async (
  creator: PublicKey,
  description: string
): Promise<[PublicKey, number]> => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('trend'), creator.toBuffer(), Buffer.from(description)],
    PROGRAM_ID
  );
};

export const getProgram = (provider: anchor.AnchorProvider) => {
  return new anchor.Program(IDL as any, provider) as any;
};

// Type for the program
export type TrendPredictionProgram = any;
