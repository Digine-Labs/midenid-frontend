// Constants
export {
  MIDEN_ID_CONTRACT_ADDRESS,
  MIDEN_FAUCET_CONTRACT_ADDRESS,
  MIDEN_FAUCET_ID_BECH32,
} from './constants';

// Contracts
export { MIDEN_ID_CONTRACT_CODE_OLD } from './contracts/miden-contract';
export { MIDEN_NAME_CONTRACT_CODE } from './contracts/miden-name-new';

// Notes
export { REGISTER_NOTE_SCRIPT_OLD } from './notes/register-note-old';
export { CLEAR_EXPIRED_DOMAIN } from './notes/clear-expired-domain';
export { EXTEND_DOMAIN_SCRIPT } from './notes/extend-domain';
export { REGISTER_WITH_REFERRER } from './notes/register-with-referrer';
export { REGISTER_NOTE_SCRIPT } from './notes/register-note-new';
export { ACTIVATE_DOMAIN } from './notes/activate-domain'