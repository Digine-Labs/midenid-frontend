/**
 * Base64 of the serialized COMPILED `register` NoteScript, exported from the
 * midenid-contracts deploy tooling via `NoteScript.serialize()`.
 *
 * WHY THIS EXISTS — do not replace with a source recompile:
 * The network account only auto-consumes notes whose note-script MAST root is in
 * the registry's `NetworkAccountNoteAllowlist`. That allowlist is built from the
 * deploy tooling's compiled note script. Recompiling `register-note.ts` +
 * `miden-name.ts` in the frontend produces a DIFFERENT root (the frontend SDK
 * bundles different std-lib/assembler builds than the Rust deploy toolchain), so
 * the note is silently ignored and stays COMMITTED forever.
 * Confirmed 2026-07-02: frontend `register` root 0x3ae77f… ≠ deployed 0xc12187a6….
 *
 * Populate this with the exact bytes whose root is one of the 9 allowlisted
 * entries in the deployed registry's `allowed_note_scripts` slot. Regenerate it
 * whenever the naming contract is redeployed.
 */
// Script root (in the deployed registry's allowed_note_scripts allowlist):
//   0xc4a918048f28815dae2d5b7205a1209b27047431af5acba13c4b5f278b89c18d
// Compiled from register_name.masm linked against naming.masm (is_network=true),
// same as create_naming_account. MAST wire version 0.0.3. 951 bytes.
export const REGISTER_NOTE_SCRIPT_COMPILED_B64 =
  'TUFTVAAAAAMPBwMJAAAAhwMwAQAAAAEAAAAAPSkwMDAwWwgAAAAAAAAALA0ICjAwMDBbBAAAAAAAAAAsDQgKMDAwMDAsDQgKAAABAAAACQkZEcAAAAAAAAAAgAAAAAAAAAAwAAAAAAAAAIACAAAAAAAAQAsAAAAAAAAwAAAAAAAAAIAAAABAAAAAAAMAAAABAAAABwAAgAEAAAAFAAAAAgAAADrnf6c7aI7En2/yXNUJMOPjo1q8tdKElDwuuYk6USXQ+9Iu0qqt+3xao72fCp+zXzkIbEfjmNdVNUEnY4skJUP4i5P7t1a1D+XrvBJafZhWYVML4MrPe1PRl5ZVB6JaO3fC4IRuRDbZg8eemQ3JTha/AVQ2JHvTHdNBcfOgo0Kn+s4tSibBkINlgk9oI/ynRl0pipAL2VdBcmnXEvNu4ms2OlMlX0PhGSori6Ep1K0lXrqtiwLeGkSlMkcBq0tISJrdGcglrsfDhhiA5J8ZyfADHyplDUbbfl6sIg3/7kcm1EjSxw0We4o3p518W9Dd2pQFeuZui0hf7j8g0Dz5gLThNfJfb3BO1AHHfXx3wETPSDSgooblJE1/5aIkBVm1uMSpGASPKIFdri1bcgWhIJsnBHQxr1rLoTxLXyeLicGNAQEBAQEBAQENAQEBAQEBAQEBAQGmAgEBAdQAAADaAAAAAwUBAQGEAQAAmQEAAAMHAQEBAQEAAAUBAAADCQQBAQoBAAAOAQAAAwsFAQEPAQAAJwEAAAMNBAEBKAEAACwBAAADCwUBAS0BAABEAQAAAw8EAQFFAQAASQEAAAMLBQEBSgEAAGABAAADEQABAcIAAAC6AQAAAxMAAQHCAAAAugEAAAMTAAEBwgAAALoBAAADEwABAcIAAAC6AQAAAxMVAQ8tO4ONl7XT8f0Nbm9maWxlHTo6bm9maWxlOjptYWluDXB1c2guMEdjYWxsLjo6bWlkZW5fbmFtZTo6bmFtaW5nOjpyZWdpc3Rlcglkcm9wCXBhZHcdbWVtX2xvYWR3X2JlLjgdbWVtX2xvYWR3X2JlLjQdbWVtX2xvYWR3X2JlLjALYmVnaW4bAAAAAA0AAAAaAAAAJwAAADQAAABBAAAATgAAAFsAAABoAAAAdQAAAIIAAACPAAAAnAAAABsBAAAAAAEBAAAAAQIAAAADAwAAAAsEAAAAFQUAAAAdBgAAACcHAAAALwgAAAABCQAAAAEKAAAAAQsAAAABDAAAABcBAQMDBRMTFRcZGwEBAQEJAAAA';
