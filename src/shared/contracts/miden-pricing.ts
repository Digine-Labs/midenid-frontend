export const MIDEN_PRICING_CONTRACT_CODE = `
## Pricing contract. Each payment token has its own pricing contract. They all must rely on same interface
use.miden::account
use.miden::account_id
use.miden::note
use.std::sys

## Errors
const.ERR_ALREADY_INITIALIZED="Contract already initialized"
const.ERR_ONLY_PRICE_SETTER="Only price setter"
const.DOMAIN_PART_HIGH="Only 7 bits per felt"
const.DOMAIN_LENGTH_TOO_HIGH="Maximum 21 characters allowed"
const.ERR_INVALID_DOMAIN_LENGTH="Domain length field does not match actual character count"
const.ERR_EMPTY_DOMAIN="Domain length zero"

## Constants
const.INIT_FLAG_SLOT=0
const.PRICE_SETTER_SLOT=1 # [0, 0, prefix, suffix]
const.PAYMENT_TOKEN_SLOT=2 # [0, 0, prefix, suffix]
const.PRICE_SLOT=3 # map(letter_count -> price)
const.CALCULATE_PRICE_ROOT=4 # PRICE_ROOT

const.MAX_LENGTH=21
const.MAX_FELT_PART=0xFFFFFFFFFFFFFF # 8*7 bits

const.PAD_4TH_CHAR=16777216
const.PAD_3RD_CHAR=65536
const.PAD_2ND_CHAR=256
const.PAD_1ST_CHAR=1

# Input: [token_prefix, token_suffix, setter_prefix, setter_suffix]
# Output: []
export.init
    push.INIT_FLAG_SLOT
    exec.account::get_item drop drop drop
    assertz.err=ERR_ALREADY_INITIALIZED
    # [token_prefix, token_suffix, setter_prefix, setter_suffix]
    push.0.0
    push.PAYMENT_TOKEN_SLOT
    exec.account::set_item dropw
    # [setter_prefix, setter_suffix]
    push.0.0
    push.PRICE_SETTER_SLOT
    exec.account::set_item dropw
    # []
    push.1.0.0.0
    push.INIT_FLAG_SLOT
    exec.account::set_item dropw
    # []
    procref.calculate_domain_cost
    # [ROOT]
    push.CALCULATE_PRICE_ROOT
    exec.account::set_item dropw
    # []
end

# Output: []
export.set_price
    exec._assert_only_setter
    # [letter_count, price]
    dup gt.5
    # [letter_count > 5, letter_count, price]
    if.true
        drop push.5
    end
    # [letter_count, price]
    push.0.0.0
    # [LETTER_COUNT, price]
    dup.4 push.0.0.0
    # [PRICE, LETTER_COUNT, price]
    swapw
    # [LETTER_COUNT, PRICE, price]
    push.PRICE_SLOT
    exec.account::set_map_item dropw dropw drop
    # []
end

# Input: [DOMAIN]
# Output: [cost]
export.calculate_domain_cost
    dupw
    exec._validate_domain_length
    # [DOMAIN]
    movdn.3
    # [f1, f2, f3, len]
    drop drop drop dup
    # [len, len]
    gt.5
    # [len > 5, DOMAIN]
    if.true
        # [len]
        drop
        push.5
    end
    # [len]
    push.0.0.0
    # [LETTER_COUNT]
    push.PRICE_SLOT
    exec.account::get_map_item
    # [PRICE]
    drop drop drop
    exec.sys::truncate_stack
    # Fix stack depth to 16
    # [cost]
end

## Internal methods

# Validates that the domain length field matches the actual character count
# Input: [length, felt1, felt2, felt3]
# Output: []
proc._validate_domain_length
    # Stack: [length, felt1, felt2, felt3]
    dup eq.0 assertz.err=ERR_EMPTY_DOMAIN
    movdn.3
    # [f1, f2, f3, length]
    exec._count_chars_in_felt
    # [f1_count, f2, f3, length]
    movdn.2
    # [f2, f3, f1_count, length]
    exec._count_chars_in_felt swap
    # [f3, f2_count, f1_count, length]
    exec._count_chars_in_felt
    # [f3_count, f2_count, f1_count, length]
    add add 
    # [f3+f2+f1, length]
    eq
    # [1 or 0]
    assert.err=ERR_INVALID_DOMAIN_LENGTH
end

# Input: [felt]
# Output: [count]
proc._count_chars_in_felt
    u32split
    # [u32_high, u32_low]
    exec._count_chars_in_u32
    # [count_high, u32_low]
    swap
    exec._count_chars_in_u32
    # [count_low, count_high]
    add
    # [count]
end

# Input: [u32]
# Output: [count]
proc._count_chars_in_u32
    push.0 swap # push count
    # [u32, count]
    u32divmod.PAD_4TH_CHAR swap
    # [bolum, kalan, count]
    gt.0
    if.true
        # [kalan, count]
        swap 
        # [count, kalan]
        add.1 swap
        # [kalan, count + 1]
    end

    u32divmod.PAD_3RD_CHAR swap
    gt.0
    if.true
        # [kalan, count]
        swap 
        # [count, kalan]
        add.1 swap
        # [kalan, count + 1]
    end
    u32divmod.PAD_2ND_CHAR swap
    gt.0
    if.true
        swap add.1 swap
    end

    u32divmod.PAD_1ST_CHAR swap
    gt.0
    if.true
        swap add.1 swap
    end
    drop
end

# Input: []
# Output: []
proc._assert_only_setter
    exec.note::get_sender
    push.PRICE_SETTER_SLOT
    exec.account::get_item
    # [0, 0, setter_prefix, setter_suffix, caller_prefix, caller_suffix]
    drop drop
    exec.account_id::is_equal assert.err=ERR_ONLY_PRICE_SETTER
    # []
end
`