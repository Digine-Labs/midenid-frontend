/**
 * Error codes for domain ERRistration process
 */
export const ErrorCodes = {
  // Client operations
  CLIENT_INIT_FAILED: "ERR_001",

  // Amount calculations
  AMOUNT_CALCULATION_FAILED: "ERR_002",

  // Domain encoding
  DOMAIN_ENCODING_FAILED: "ERR_003",

  // Note operations
  NOTE_INPUTS_CREATION_FAILED: "ERR_004",
  FELT_CONVERSION_FAILED: "ERR_005",

  // Transaction operations
  TRANSACTION_CREATION_FAILED: "ERR_006",
  SCRIPT_BUILDER_AND_COMPILER: "ERR_007",
  NOTE_CREATION: "ERR_008",
  TRANSACTION_REQ_CREATION: "ERR_009",
  TRANSACTION_SUBMIT: "ERR_010",

  // Balance checking
  BALANCE_CHECK: "ERR_011",

  // General errors
  UNKNOWN_ERROR: "ERR_999",
} as const;

export type ErrorCodes = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Error code to user-friendly message mapping
 */
export const ERROR_MESSAGES: Record<ErrorCodes, string> = {
  [ErrorCodes.CLIENT_INIT_FAILED]: "Failed to initialize Miden client",
  [ErrorCodes.AMOUNT_CALCULATION_FAILED]: "Failed to calculate purchase amount",
  [ErrorCodes.DOMAIN_ENCODING_FAILED]: "Invalid domain format",
  [ErrorCodes.NOTE_INPUTS_CREATION_FAILED]: "Failed to prepare transaction data",
  [ErrorCodes.FELT_CONVERSION_FAILED]: "Failed to process transaction parameters",
  [ErrorCodes.TRANSACTION_CREATION_FAILED]: "Transaction failed",
  [ErrorCodes.SCRIPT_BUILDER_AND_COMPILER]: "Failed to create script builder or compile script",
  [ErrorCodes.NOTE_CREATION]: "Failed to create note",
  [ErrorCodes.TRANSACTION_REQ_CREATION]: "Failed to create transaction request",
  [ErrorCodes.TRANSACTION_SUBMIT]: "Failed to submit the transaction",
  [ErrorCodes.BALANCE_CHECK]: "Failed to check balance",
  [ErrorCodes.UNKNOWN_ERROR]: "An unexpected error occurred",
};
