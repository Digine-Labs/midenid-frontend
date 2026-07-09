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
//   0x8b8977cf88c8d027ee95e91b20e113588a204cad676ef6480abaae85ccc0fd69
// Compiled from register_name.masm linked against naming.masm (is_network=true),
// same as create_naming_account. MAST wire version 0.0.3. 951 bytes.
export const REGISTER_NOTE_SCRIPT_COMPILED_B64 =
  'TUFTVAAAAAMPBwMJAAAAhwMwAQAAAAEAAAAAPSkwMDAwWwgAAAAAAAAALA0ICjAwMDBbBAAAAAAAAAAsDQgKMDAwMDAsDQgKAAABAAAACQkZEcAAAAAAAAAAgAAAAAAAAAAwAAAAAAAAAIACAAAAAAAAQAsAAAAAAAAwAAAAAAAAAIAAAABAAAAAAAMAAAABAAAABwAAgAEAAAAFAAAAAgAAADrnf6c7aI7En2/yXNUJMOPjo1q8tdKElDwuuYk6USXQLPooFiEXirJaZTlsVCus+dBvPVLQ47jvY+OA+MH2/7z4i5P7t1a1D+XrvBJafZhWYVML4MrPe1PRl5ZVB6JaO3fC4IRuRDbZg8eemQ3JTha/AVQ2JHvTHdNBcfOgo0KnJgcHutAmfLh6uYuUkCiGccHjRcqNNfjEuWtymONn/hI2OlMlX0PhGSori6Ep1K0lXrqtiwLeGkSlMkcBq0tISJrdGcglrsfDhhiA5J8ZyfADHyplDUbbfl6sIg3/7kcm8JWA5qzFVuf6mtIj2/ilLfSxswig5T7EadA3k6FbbuXNMJtJydJFD/OWJ0MZe0JE0CJYtlHQyWGkU4sbIRqcNouJd8+IyNAn7pXpGyDhE1iKIEytZ272SAq6roXMwP1pAQEBAQEBAQENAQEBAQEBAQEBAQGmAgEBAdQAAADaAAAAAwUBAQGEAQAAmQEAAAMHAQEBAQEAAAUBAAADCQQBAQoBAAAOAQAAAwsFAQEPAQAAJwEAAAMNBAEBKAEAACwBAAADCwUBAS0BAABEAQAAAw8EAQFFAQAASQEAAAMLBQEBSgEAAGABAAADEQABAcIAAAC6AQAAAxMAAQHCAAAAugEAAAMTAAEBwgAAALoBAAADEwABAcIAAAC6AQAAAxMVAQ8tO4ONl7XT8f0Nbm9maWxlHTo6bm9maWxlOjptYWluDXB1c2guMEdjYWxsLjo6bWlkZW5fbmFtZTo6bmFtaW5nOjpyZWdpc3Rlcglkcm9wCXBhZHcdbWVtX2xvYWR3X2JlLjgdbWVtX2xvYWR3X2JlLjQdbWVtX2xvYWR3X2JlLjALYmVnaW4bAAAAAA0AAAAaAAAAJwAAADQAAABBAAAATgAAAFsAAABoAAAAdQAAAIIAAACPAAAAnAAAABsBAAAAAAEBAAAAAQIAAAADAwAAAAsEAAAAFQUAAAAdBgAAACcHAAAALwgAAAABCQAAAAEKAAAAAQsAAAABDAAAABcBAQMDBRMTFRcZGwEBAQEJAAAA';
