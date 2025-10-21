export const REGISTER_NOTE_SCRIPT = `
use.miden_id::registry
use.miden::note
use.std::sys

const.NOTE_INPUT_PTR=0

# Input to this note is provided via note inputs
# Inputs: [NAME_WORD] (Word containing encoded name)
begin
    # Load the name from note inputs
    push.NOTE_INPUT_PTR
    exec.note::get_inputs
    push.0
    mem_loadw

    # Register the name
    call.registry::register_name
    exec.sys::truncate_stack
end
`;