export const MIDEN_NAMING_CONTRACT_CODE = `
use.miden::account
use.miden::account_id
use.miden::note
use.miden::tx

## Errors
const.ERR_ONLY_OWNER="Only owner"
const.ERR_ONLY_DOMAIN_OWNER="Only domain owner"
const.ERR_ALREADY_INITIALIZED="Contract already initialized"
const.ERR_PAYMENT_TOKEN_NOT_ALLOWED="This payment token not allowed"
const.ERR_VALIDATE_PAYMENT_SUB_OVERFLOW="Validating payment sub overflow"
const.ERR_INSUFFICIENT_AMOUNT_PAID="Paid amount less that price"
const.ERR_DOMAIN_NOT_AVAILABLE="Domain is already taken"
const.ERR_DOMAIN_LENGTH_TOO_HIGH="21 characters allowed"

## Constants
const.INIT_FLAG_SLOT=0
const.OWNER_SLOT=1
const.TREASURY_SLOT=2
const.PAYMENT_TOKEN_TO_CONTRACT_ID_SLOT=3
const.ACCOUNT_ID_TO_DOMAIN_SLOT=4
const.DOMAIN_TO_ACCOUNT_ID_SLOT=5
const.DOMAIN_TO_OWNER_SLOT=6
const.PRICING_CONTRACT_TO_CALCULATE_PROC_ROOT=7

const.MAX_NAME_LENGTH=21

## Storage
# 0: init flag [0, 0, 0, flag]
# 1: owner [0, 0, prefix, suffix]
# 2: treasury [0, 0, prefix, suffix]
# 3: map(payment_token -> pricing contract ID)
# 4: Account to domain map([0, 0, account_prefix, account_suffix] -> DOMAIN)
# 5: Domain to account map(DOMAIN -> [0, 0, account_prefix, account_suffix])
# 6: Domain to owner map(DOMAIN -> [0, 0, owner_prefix, owner_suffix])
# 7: Pricing contract to calculate_price procedure root hash map([0, 0, prefix, suffix] -> ROOT)

# Input: [owner_prefix, owner_suffix, treasury_prefix, treasury_suffix]
export.init
    push.INIT_FLAG_SLOT
    exec.account::get_item drop drop drop
    assertz.err=ERR_ALREADY_INITIALIZED
    # [owner_prefix, owner_suffix, treasury_prefix, treasury_suffix]
    push.0.0
    # [OWNER, treasury_prefix, treasury_suffix]
    push.OWNER_SLOT
    exec.account::set_item dropw
    push.0.0
    # [TREASURY]
    push.TREASURY_SLOT
    exec.account::set_item dropw
    # []
    push.1.0.0.0
    push.INIT_FLAG_SLOT
    exec.account::set_item dropw
    # []
end

# Input: [payment_token_prefix, payment_token_suffix, DOMAIN]
# Output: []
export.register
    push.0.0
    # [PAYMENT_TOKEN, DOMAIN]
    swapw dupw
    # [DOMAIN, DOMAIN, PAYMENT_TOKEN]
    dupw exec._assert_domain_available
    # [DOMAIN, DOMAIN, PAYMENT_TOKEN]
    dupw exec._assert_domain_rules
    # [DOMAIN, DOMAIN, PAYMENT_TOKEN]
    exec.note::get_sender
    # [caller_prefix, caller_suffix, DOMAIN, DOMAIN, PAYMENT_TOKEN]
    exec._update_domain_map
    # [DOMAIN, PAYMENT_TOKEN]
    dupw exec.note::get_sender exec._update_domain_owner
    # [DOMAIN, PAYMENT_TOKEN]
    swapw dupw swapw.2 swapw
    # [PAYMENT_TOKEN, DOMAIN, PAYMENT_TOKEN]
    push.PAYMENT_TOKEN_TO_CONTRACT_ID_SLOT exec.account::get_map_item
    # [PRICING_CONTRACT, DOMAIN, PAYMENT_TOKEN]
    padw 
    # [ZERO, PRICING_CONTRACT, DOMAIN, PAYMENT_TOKEN]
    eqw
    # [isEqual, ZERO, PRICING_CONTRACT, DOMAIN, PAYMENT_TOKEN]
    assertz.err=ERR_PAYMENT_TOKEN_NOT_ALLOWED dropw
    # [PRICING_CONTRACT, DOMAIN, PAYMENT_TOKEN]
    dupw drop drop exec._get_calculate_price_root
    # [ROOT, PRICING_CONTRACT, DOMAIN, PAYMENT_TOKEN]
    swapw drop drop
    # [pricing_prefix, pricing_suffix, PROC_ROOT, DOMAIN, PAYMENT_TOKEN]
    exec.tx::execute_foreign_procedure
    # [<outputs>] expected: [cost, PAYMENT_TOKEN]
    movdn.4 drop drop
    # [prefix, suffix, cost]
    exec._receive_payment
    # []
end

# Input: [new_owner_prefix, new_owner_suffix, DOMAIN]
export.transfer
    push.0.0
    # [NEW_OWNER, DOMAIN]
    swapw
    # [DOMAIN, NEW_OWNER]
    dupw
    # [DOMAIN, DOMAIN, NEW_OWNER]
    exec._assert_only_domain_owner
    # [DOMAIN, NEW_OWNER]
    dupw
    # [DOMAIN, DOMAIN, NEW_OWNER]
    exec.note::get_sender
    # [prefix, suffix, DOMAIN, DOMAIN, NEW_OWNER]
    exec._clear_domain_mapping
    # [DOMAIN, NEW_OWNER]
    push.DOMAIN_TO_OWNER_SLOT
    exec.account::set_map_item dropw dropw
    # []
end

# Input: [DOMAIN]
# Output: []
export.set_default_domain
    dupw
    exec._assert_only_domain_owner
    # [DOMAIN]
    exec.note::get_sender
    # [caller_prefix, caller_suffix, DOMAIN]
    exec._update_domain_map
    # []
end

## Resolver functions
# Input: [account_prefix, account_suffix]
# Output: [DOMAIN]
export.domain_by_account_id
    push.0.0
    # [0, 0, prefix, suffix]
    push.ACCOUNT_ID_TO_DOMAIN_SLOT
    # [slot, 0, 0, prefix, suffix]
    exec.account::get_map_item
    # [DOMAIN]
end

# Input: [DOMAIN]
# Output: [prefix, suffix]
export.account_id_by_domain
    push.DOMAIN_TO_ACCOUNT_ID_SLOT
    exec.account::get_map_item drop drop
    # [prefix, suffix]
end

# Input: [DOMAIN]
# Output: [prefix, suffix]
export.owner_of_domain
    push.DOMAIN_TO_OWNER_SLOT
    # [slot, DOMAIN]
    exec.account::get_map_item drop drop
    # [owner_prefix, owner_suffix]
end

# Input: [ASSET]
# Output: [pad(16)]
export.receive_asset
    exec.account::add_asset
    # => [ASSET', pad(12)]

    # drop the final asset
    dropw
    # => [pad(16)]
end

## Only Owner
# Input: [new_owner_prefix, new_owner_suffix]
# Output: []
export.update_registry_owner
    exec._assert_only_owner
    push.0.0
    # [0, 0, new_owner_prefix, new_owner_suffix]
    push.OWNER_SLOT
    exec.account::set_item
    dropw
end

# Input: [prefix, suffix]
# Output: []
export.withdraw_assets
    # TODO
    exec._assert_only_owner
    nop
end

# Input: [new_treasury_prefix, new_treasury_suffix]
# Output: []
export.update_treasury
    exec._assert_only_owner
    push.0.0
    # [0, 0, new_treasury_prefix, new_treasury_suffix]
    push.TREASURY_SLOT
    exec.account::set_item
    dropw
end

# Input: [token_prefix, token_suffix, contract_prefix, contract_suffix]
# Output: []
export.set_payment_token_contract
    exec._assert_only_owner
    # [token_prefix, token_suffix, contract_prefix, contract_suffix]
    push.0.0
    # [0, 0, token_prefix, token_suffix, contract_prefix, contract_suffix]
    movup.5 movup.5
    # [contract_prefix, contract_suffix, 0, 0, token_prefix, token_suffix]
    movdn.3 movdn.3
    # [0, 0, contract_prefix, contract_suffix, token_prefix, token_suffix]
    push.0.0
    # [0, 0, 0, 0, contract_prefix, contract_suffix, token_prefix, token_suffix]
    movup.7 movup.7
    # [token_prefix, token_suffix, 0, 0, 0, 0, contract_prefix, contract_suffix]
    movdn.3 movdn.3
    # [0, 0, token_prefix, token_suffix, 0, 0, contract_prefix, contract_suffix]
    push.PAYMENT_TOKEN_TO_CONTRACT_ID_SLOT
    # [10, 0, 0, token_prefix, token_suffix, 0, 0, contract_prefix, contract_suffix]
    exec.account::set_map_item
    # [OLD_VALUE, OLD_KEY]
    dropw dropw
    # []
end

# Input: [PRICING_CONTRACT, PROC_ROOT]
# Output: []
export.set_calculate_price_root
    exec._assert_only_owner
    push.PRICING_CONTRACT_TO_CALCULATE_PROC_ROOT
    exec.account::set_map_item dropw dropw
    # []
end

## Internal procedures
# Input: [pricing_contract_prefix, pricing_contract_suffix]
# Output: [ROOT]
proc._get_calculate_price_root
    push.0.0
    push.PRICING_CONTRACT_TO_CALCULATE_PROC_ROOT
    exec.account::get_map_item
    # [ROOT]
end

### Clears domain to account and account to domain mapping if this domain set as default domain.
# Input: [prefix, suffix, DOMAIN]
# Output: []
proc._clear_domain_mapping
    push.0.0
    # [ACCOUNT, DOMAIN]
    swapw
    # [DOMAIN, ACCOUNT]
    dupw
    # [DOMAIN, DOMAIN, ACCOUNT]
    padw
    # [ZERO, DOMAIN, DOMAIN, ACCOUNT]
    swapw
    # [DOMAIN, ZERO, DOMAIN, ACCOUNT]
    push.DOMAIN_TO_ACCOUNT_ID_SLOT
    exec.account::set_map_item dropw dropw
    # [DOMAIN, ACCOUNT]
    dupw.1
    # [ACCOUNT, DOMAIN, ACCOUNT]
    push.ACCOUNT_ID_TO_DOMAIN_SLOT
    exec.account::get_map_item
    # [A2D, DOMAIN, ACCOUNT]
    eqw
    # [1 if domain is set as default, A2D, DOMAIN, ACCOUNT]
    if.true
        # [A2D, DOMAIN, ACCOUNT]
        dropw dropw
        # [ACCOUNT]
        padw swapw
        # [ACCOUNT, ZERO]
        push.ACCOUNT_ID_TO_DOMAIN_SLOT
        exec.account::set_map_item dropw dropw
        # []
    else
        # [A2D, DOMAIN, ACCOUNT]
        dropw dropw dropw
    end
end

# Input: [account_prefix, account_suffix, DOMAIN]
# Output: []
proc._update_domain_map
    push.0.0
    # [ACCOUNT, DOMAIN]
    dupw dupw.2
    # [DOMAIN, ACCOUNT, ACCOUNT, DOMAIN]
    push.DOMAIN_TO_ACCOUNT_ID_SLOT
    exec.account::set_map_item dropw dropw
    # [ACCOUNT, DOMAIN]
    push.ACCOUNT_ID_TO_DOMAIN_SLOT
    exec.account::set_map_item dropw dropw
    # []
end

# Input: [new_owner_prefix, new_owner_suffix, DOMAIN]
# Output: []
proc._update_domain_owner
    push.0.0
    # [0,0, prefix, suffix, DOMAIN]
    swapw
    # [DOMAIN, 0, 0, prefix, suffix]
    push.DOMAIN_TO_OWNER_SLOT
    # [slot, DOMAIN, 0, 0, prefix, suffix]
    exec.account::set_map_item dropw dropw
    # []
end

# Input: [token_prefix, token_suffix]
# Output: [1 or 0]
proc._is_token_available_for_payment
    push.PAYMENT_TOKEN_TO_CONTRACT_ID_SLOT
    exec.account::get_map_item drop drop
    # [contract_prefix, contract_suffix]
    push.0.0
    exec.account_id::is_equal
    # [1 if token contract zero]
    not
    # [1 or 0]
end

# Input: [DOMAIN]
# Output: [1 or 0]
proc._is_domain_exist
    push.DOMAIN_TO_OWNER_SLOT
    # [slot, DOMAIN]
    exec.account::get_map_item drop drop
    # [prefix, suffix]
    push.0.0
    # [0, 0, prefix, suffix]
    exec.account_id::is_equal
    # [1 if not owner]
    not
    # [1 or 0]
end

# Input: [DOMAIN]
# Output: []
proc._assert_domain_available
    push.DOMAIN_TO_OWNER_SLOT
    exec.account::get_map_item drop drop
    push.0.0 exec.account_id::is_equal

    assert.err=ERR_DOMAIN_NOT_AVAILABLE
end

# Input: [DOMAIN]
# Output: []
proc._assert_domain_rules
    lte.MAX_NAME_LENGTH
    # [len_check, f1, f2, f3]
    assert.err=ERR_DOMAIN_LENGTH_TOO_HIGH
    # [f1, f2, f3]
    drop drop drop
end

# Input: [prefix, suffix]
# Output: [balance]
proc._get_balance
    exec.account::get_balance
    # [balance]
end

# Input: [prefix, suffix, min_amt]
# Output: []
proc._receive_payment
    dup.1 dup.1
    # [prefix, suffix, prefix, suffix, min_amt]
    exec._get_balance
    # [init_bal, prefix, suffix, min_amt]
    exec.note::add_assets_to_account swap.2 swap
    # [prefix, suffix, init_bal, min_amt]
    exec._get_balance
    # [final_bal, init_bal, min_amt]
    swap u32overflowing_sub assertz.err=ERR_VALIDATE_PAYMENT_SUB_OVERFLOW
    # [result, min_amt]
    lte assert.err=ERR_INSUFFICIENT_AMOUNT_PAID
    # []
end

# Input: []
# Output: []
proc._assert_only_owner
    exec.note::get_sender
    # [caller_prefix, caller_suffix]
    push.OWNER_SLOT
    exec.account::get_item
    # [0, 0, owner_prefix, owner_suffix, caller_prefix, caller_suffix]
    drop drop
    # [owner_prefix, owner_suffix, caller_prefix, caller_suffix]
    exec.account_id::is_equal assert.err=ERR_ONLY_OWNER
    # []
end

# Input: [DOMAIN]
# Output: []
proc._assert_only_domain_owner
    push.DOMAIN_TO_OWNER_SLOT
    # [slot, DOMAIN]
    exec.account::get_map_item
    # [OWNER]
    drop drop
    # [owner_prefix, owner_suffix]
    exec.note::get_sender
    # [caller_prefix, caller_suffix, owner_prefix, owner_suffix]
    exec.account_id::is_equal assert.err=ERR_ONLY_DOMAIN_OWNER
    # []
end
`