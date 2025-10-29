use anchor_lang::prelude::*;

#[constant]
pub const PROPOSAL_SEED: &str = "proposal";

#[constant]
pub const MIN_PROPOSAL_DURATION: i64 = 3600; // 1 hour minimum

#[constant]
pub const MAX_PROPOSAL_DURATION: i64 = 7776000; // 90 days maximum
