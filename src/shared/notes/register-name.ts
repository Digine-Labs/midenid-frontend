export const REGISTER_NAME_NOTE = `
use.miden_name::naming
use.miden::note
use.std::sys

const.TOKEN_PTR=0
const.DOMAIN_PTR=4
# Input (arguments): [TOKEN, DOMAIN]
begin
    push.0
    exec.note::get_inputs
    drop drop
    mem_loadw.DOMAIN_PTR padw mem_loadw.TOKEN_PTR drop drop
    # [prefix, suffix, DOMAIN]
    call.naming::register
    exec.sys::truncate_stack
end
`