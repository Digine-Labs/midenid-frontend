export const INIT_NAMING_NOTE = `
use.miden_name::naming
use.miden::note
use.std::sys

const.INITIALIZE_NOTE_INPUT_PTR=0

# Input (arguments): [owner_prefix, owner_suffix, treasury_prefix, treasury_suffix]
begin
    push.INITIALIZE_NOTE_INPUT_PTR
    exec.note::get_inputs
    # [num_inputs, init_ptr]
    drop drop push.INITIALIZE_NOTE_INPUT_PTR
    mem_loadw
    # [INPUTS]
    call.naming::init
    exec.sys::truncate_stack
end
`