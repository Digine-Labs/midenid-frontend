// Constants
export {
  MIDEN_ID_CONTRACT_ADDRESS,
  MIDEN_FAUCET_CONTRACT_ADDRESS,
  MIDEN_FAUCET_ID_BECH32,
} from './constants';

// Contracts
export { MIDEN_ID_CONTRACT_CODE } from './contracts/miden-contract';
export { MIDEN_NAMING_CONTRACT_CODE } from './contracts/miden-naming';
export { MIDEN_PRICING_CONTRACT_CODE } from './contracts/miden-pricing';

// Notes
export { REGISTER_NOTE_SCRIPT } from './notes/miden-register-note';
export { INIT_NAMING_NOTE } from './notes/init-naming';
export { REGISTER_NAME_NOTE } from './notes/register-name';
