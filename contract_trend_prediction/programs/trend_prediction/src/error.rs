use anchor_lang::prelude::*;

#[error_code]
pub enum ProposalError {
    // Title & Description Errors
    #[msg("Title exceeds maximum length of 100 characters")]
    TitleTooLong,

    #[msg("Description exceeds maximum length of 500 characters")]
    DescriptionTooLong,

    // Voting Errors
    #[msg("Proposal is already closed")]
    ProposalClosed,

    #[msg("Proposal has expired")]
    ProposalExpired,

    #[msg("You have already voted YES")]
    AlreadyVotedYes,

    #[msg("You have already voted NO")]
    AlreadyVotedNo,

    #[msg("Maximum number of voters reached")]
    MaxVotersReached,

    // Proposal State Errors
    #[msg("Proposal has already been closed")]
    ProposalAlreadyClosed,

    #[msg("Unauthorized - only author can close proposal")]
    Unauthorized,

    // Arithmetic Errors
    #[msg("Arithmetic overflow occurred")]
    Overflow,

    #[msg("Arithmetic underflow occurred")]
    Underflow,
}
