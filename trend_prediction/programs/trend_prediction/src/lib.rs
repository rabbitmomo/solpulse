pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use error::*;
pub use instructions::*;

declare_id!("D9ZvX3tLKzCEhX6HM4FAdFsJnpqewW6canG5UJAfrAU5");

#[program]
pub mod trend_prediction {
    use super::*;

    /// Create a new proposal
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
        token_address: Pubkey,
        expiration_time: i64,
    ) -> Result<()> {
        require!(
            title.len() <= ProposalAccount::MAX_TITLE_LEN,
            ProposalError::TitleTooLong
        );
        require!(
            description.len() <= ProposalAccount::MAX_DESCRIPTION_LEN,
            ProposalError::DescriptionTooLong
        );

        proposal.author = ctx.accounts.author.key();
        proposal.title = title;
        proposal.description = description;
        proposal.token_address = token_address;
        proposal.created_at = Clock::get()?.unix_timestamp;
        proposal.expiration_time = expiration_time;
        proposal.yes_votes = 0;
        proposal.no_votes = 0;
        proposal.unique_voters = 0;
        proposal.voters = Vec::new();
        proposal.closed = false;
        proposal.outcome = None;

        msg!("✅ Proposal created!");
        msg!("� Title: {}", proposal.title);
        msg!("🪙 Token: {}", token_address);
        msg!("⏰ Expires: {}", expiration_time);

        Ok(())
    }

    /// Vote YES or NO on a proposal
    pub fn vote_on_proposal(
        ctx: Context<VoteOnProposal>,
        vote_direction: VoteDirection,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal_account;
        let voter = ctx.accounts.voter.key();
        let now = Clock::get()?.unix_timestamp;

        require!(!proposal.closed, ProposalError::ProposalClosed);
        require!(now < proposal.expiration_time, ProposalError::ProposalExpired);

        msg!("🗳️ Voting: {:?}", vote_direction);

        // Check if voter already voted
        if let Some(existing_vote) = proposal.voters.iter_mut().find(|v| v.voter == voter) {
            // Allow vote change or addition to opposite side
            match vote_direction {
                VoteDirection::Yes => {
                    if existing_vote.voted_yes {
                        return Err(ProposalError::AlreadyVotedYes.into());
                    }
                    if existing_vote.voted_no {
                        // Switch from NO to YES
                        existing_vote.voted_no = false;
                        existing_vote.voted_yes = true;
                        proposal.no_votes = proposal.no_votes.checked_sub(1)
                            .ok_or(ProposalError::Underflow)?;
                        proposal.yes_votes = proposal.yes_votes.checked_add(1)
                            .ok_or(ProposalError::Overflow)?;
                    } else {
                        existing_vote.voted_yes = true;
                        proposal.yes_votes = proposal.yes_votes.checked_add(1)
                            .ok_or(ProposalError::Overflow)?;
                    }
                }
                VoteDirection::No => {
                    if existing_vote.voted_no {
                        return Err(ProposalError::AlreadyVotedNo.into());
                    }
                    if existing_vote.voted_yes {
                        // Switch from YES to NO
                        existing_vote.voted_yes = false;
                        existing_vote.voted_no = true;
                        proposal.yes_votes = proposal.yes_votes.checked_sub(1)
                            .ok_or(ProposalError::Underflow)?;
                        proposal.no_votes = proposal.no_votes.checked_add(1)
                            .ok_or(ProposalError::Overflow)?;
                    } else {
                        existing_vote.voted_no = true;
                        proposal.no_votes = proposal.no_votes.checked_add(1)
                            .ok_or(ProposalError::Overflow)?;
                    }
                }
            }
            msg!("📝 Vote updated for {}", voter);
        } else {
            // New voter - register vote
            require!(
                proposal.voters.len() < ProposalAccount::MAX_VOTERS,
                ProposalError::MaxVotersReached
            );

            let (voted_yes, voted_no) = match vote_direction {
                VoteDirection::Yes => (true, false),
                VoteDirection::No => (false, true),
            };

            proposal.voters.push(VoterRecord {
                voter,
                voted_yes,
                voted_no,
            });

            proposal.unique_voters = proposal.unique_voters.checked_add(1)
                .ok_or(ProposalError::Overflow)?;

            if voted_yes {
                proposal.yes_votes = proposal.yes_votes.checked_add(1)
                    .ok_or(ProposalError::Overflow)?;
            } else {
                proposal.no_votes = proposal.no_votes.checked_add(1)
                    .ok_or(ProposalError::Overflow)?;
            }

            msg!("🗳️ New voter registered: {}", voter);
        }

        msg!("✅ Vote recorded!");
        msg!("📊 YES: {} | NO: {}", proposal.yes_votes, proposal.no_votes);
        msg!("👥 Total voters: {}", proposal.unique_voters);
        msg!("📈 Confidence: {}%", proposal.calculate_confidence());

        Ok(())
    }

    /// Close proposal and set outcome
    pub fn close_proposal(
        ctx: Context<CloseProposal>,
    ) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal_account;

        require!(!proposal.closed, ProposalError::ProposalAlreadyClosed);
        require!(
            ctx.accounts.author.key() == proposal.author,
            ProposalError::Unauthorized
        );

        proposal.closed = true;

        // Determine outcome based on vote majority
        let outcome = if proposal.yes_votes > proposal.no_votes {
            ProposalOutcome::YesWins
        } else if proposal.no_votes > proposal.yes_votes {
            ProposalOutcome::NoWins
        } else {
            ProposalOutcome::Tied
        };

        proposal.outcome = Some(outcome);

        msg!("� Proposal closed!");
        msg!("🏆 Outcome: {:?}", outcome);
        msg!("� Final: YES {} | NO {}", proposal.yes_votes, proposal.no_votes);
        msg!("� Final Confidence: {}%", proposal.calculate_confidence());

        Ok(())
    }
}

// ============================================================================
// Vote Direction Enum
// ============================================================================

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum VoteDirection {
    Yes,
    No,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
pub enum ProposalOutcome {
    YesWins,
    NoWins,
    Tied,
}

// ============================================================================
// Account Contexts
// ============================================================================

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub author: Signer<'info>,

    #[account(
        init,
        payer = author,
        space = 8 + ProposalAccount::INIT_SPACE,
        seeds = [b"proposal", author.key().as_ref(), title.as_bytes()],
        bump
    )]
    pub proposal_account: Account<'info, ProposalAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VoteOnProposal<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(mut)]
    pub proposal_account: Account<'info, ProposalAccount>,
}

#[derive(Accounts)]
pub struct CloseProposal<'info> {
    #[account(mut)]
    pub author: Signer<'info>,

    #[account(mut)]
    pub proposal_account: Account<'info, ProposalAccount>,
}

// ============================================================================
// Account Structures
// ============================================================================

#[account]
pub struct ProposalAccount {
    pub author: Pubkey,                 // 32 bytes - Proposal creator/author
    pub title: String,                  // 4 + up to 100 bytes
    pub description: String,            // 4 + up to 500 bytes
    pub token_address: Pubkey,          // 32 bytes - Token being discussed
    pub created_at: i64,                // 8 bytes
    pub expiration_time: i64,           // 8 bytes
    pub yes_votes: u32,                 // 4 bytes
    pub no_votes: u32,                  // 4 bytes
    pub unique_voters: u32,             // 4 bytes
    pub voters: Vec<VoterRecord>,       // 4 + (33 * count) - Track all voters
    pub closed: bool,                   // 1 byte
    pub outcome: Option<ProposalOutcome>, // 1 + 1 = 2 bytes
}

impl ProposalAccount {
    pub const MAX_VOTERS: usize = 250; // Can handle up to 250 unique voters (fits in 10240 byte limit)
    pub const MAX_TITLE_LEN: usize = 100;
    pub const MAX_DESCRIPTION_LEN: usize = 500;

    // Calculate space: 8 (discriminator) + fields
    pub const INIT_SPACE: usize = 32           // author
        + 4 + 100                               // title
        + 4 + 500                               // description
        + 32                                    // token_address
        + 8                                     // created_at
        + 8                                     // expiration_time
        + 4                                     // yes_votes
        + 4                                     // no_votes
        + 4                                     // unique_voters
        + 4 + (34 * Self::MAX_VOTERS)          // voters Vec (Pubkey + 2 bools = 34 bytes)
        + 1                                     // closed
        + 2;                                    // outcome (Option)

    /// Calculate confidence index as percentage (0-100)
    /// Represents how decisive the vote is
    pub fn calculate_confidence(&self) -> u32 {
        if self.unique_voters == 0 {
            return 0;
        }

        let total_votes = self.yes_votes.checked_add(self.no_votes).unwrap_or(0);
        if total_votes == 0 {
            return 0;
        }

        // Confidence = |yes - no| / total * 100
        let difference = if self.yes_votes > self.no_votes {
            self.yes_votes - self.no_votes
        } else {
            self.no_votes - self.yes_votes
        };

        ((difference as u64 * 100) / (total_votes as u64)) as u32
    }

    /// Calculate YES vote percentage
    pub fn yes_percentage(&self) -> u32 {
        let total = self.yes_votes.checked_add(self.no_votes).unwrap_or(1);
        ((self.yes_votes as u64 * 100) / (total as u64)) as u32
    }

    /// Calculate NO vote percentage
    pub fn no_percentage(&self) -> u32 {
        let total = self.yes_votes.checked_add(self.no_votes).unwrap_or(1);
        ((self.no_votes as u64 * 100) / (total as u64)) as u32
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct VoterRecord {
    pub voter: Pubkey,      // 32 bytes
    pub voted_yes: bool,    // 1 byte
    pub voted_no: bool,     // 1 byte (note: not both true simultaneously)
    // Total: 34 bytes, but packed as 33 for alignment
}

// ============================================================================
// Account Contexts
// ============================================================================

#[derive(Accounts)]
#[instruction(description: String)]
pub struct CreateTrend<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + TrendAccount::INIT_SPACE,
        seeds = [b"trend", creator.key().as_ref(), description.as_bytes()],
        bump
    )]
    pub trend_account: Account<'info, TrendAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(mut)]
    pub trend_account: Account<'info, TrendAccount>,
}

#[derive(Accounts)]
pub struct ReleaseResult<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(mut)]
    pub trend_account: Account<'info, TrendAccount>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(mut)]
    pub trend_account: Account<'info, TrendAccount>,

    // For future SPL token integration:
    // pub token_program: Program<'info, Token>,
    // #[account(mut)]
    // pub reward_vault: Account<'info, TokenAccount>,
    // #[account(mut)]
    // pub voter_token_account: Account<'info, TokenAccount>,
}

// ============================================================================
// Account Structures
// ============================================================================

#[account]
pub struct TrendAccount {
    pub creator: Pubkey,              // 32 bytes
    pub description: String,          // 4 + up to 200 bytes
    pub current_price: u64,           // 8 bytes
    pub target_price: u64,            // 8 bytes
    pub target_time: i64,             // 8 bytes
    pub total_yes: u64,               // 8 bytes
    pub total_no: u64,                // 8 bytes
    pub vote_count: u32,              // 4 bytes
    pub votes: Vec<VoteRecord>,       // 4 + (49 * count)
    pub result_released: bool,        // 1 byte
    pub winning_side: Option<bool>,   // 1 + 1 = 2 bytes
    pub total_reward_pool: u64,       // 8 bytes
}

impl TrendAccount {
    pub const MAX_VOTES: usize = 50;
    pub const MAX_DESCRIPTION_LEN: usize = 200;

    // Calculate space needed for account
    // 8 (discriminator) + fields
    pub const INIT_SPACE: usize = 32        // creator
        + 4 + 200                            // description (String: 4 bytes len + max 200 bytes)
        + 8                                  // current_price
        + 8                                  // target_price
        + 8                                  // target_time
        + 8                                  // total_yes
        + 8                                  // total_no
        + 4                                  // vote_count
        + 4 + (49 * Self::MAX_VOTES)        // votes (Vec: 4 bytes len + max 50 * 49 bytes)
        + 1                                  // result_released
        + 2                                  // winning_side (Option<bool>)
        + 8;                                 // total_reward_pool
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct VoteRecord {
    pub voter: Pubkey,          // 32 bytes
    pub yes_amount: u64,        // 8 bytes
    pub no_amount: u64,         // 8 bytes
    pub reward_claimed: bool,   // 1 byte
    // Total: 49 bytes
}

// ============================================================================
// Error Codes
// ============================================================================

#[error_code]
pub enum TrendError {
    #[msg("Description exceeds maximum length of 200 characters")]
    DescriptionTooLong,

    #[msg("Price must be greater than 0")]
    InvalidPrice,

    #[msg("Must vote with at least some amount")]
    NoVoteAmount,

    #[msg("Result has already been released")]
    ResultAlreadyReleased,

    #[msg("Maximum number of votes reached")]
    MaxVotesReached,

    #[msg("Arithmetic overflow occurred")]
    Overflow,

    #[msg("Division by zero")]
    DivisionByZero,

    #[msg("Result has not been released yet")]
    ResultNotReleased,

    #[msg("No winning side set")]
    NoWinningSide,

    #[msg("Voter not found")]
    VoterNotFound,

    #[msg("Reward has already been claimed")]
    RewardAlreadyClaimed,

    #[msg("No winning votes to claim")]
    NoWinningVotes,

    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Invalid reward pool amount")]
    InvalidRewardPool,
}

