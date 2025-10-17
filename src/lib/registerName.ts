import {
    AccountId,
    AssemblerUtils,
    Felt,
    FeltArray,
    FungibleAsset,
    Note,
    NoteAssets,
    NoteExecutionHint,
    NoteInputs,
    NoteMetadata,
    NoteRecipient,
    NoteTag,
    NoteType,
    OutputNote,
    OutputNotesArray,
    TransactionKernel,
    TransactionRequestBuilder,
    Word,
} from '@demox-labs/miden-sdk';
import {
    CustomTransaction,
    type MidenTransaction,
    TransactionType,
} from "@demox-labs/miden-wallet-adapter";
import { generateRandomSerialNumber, accountIdToBech32, instantiateClient } from "./midenClient";
import {
    MIDEN_ID_CONTRACT_CODE,
    REGISTER_NOTE_SCRIPT,
} from "@/shared/constants";

export interface NoteFromMasmParams {
    senderAccountId: AccountId;
    destinationAccountId: AccountId;
    faucetId: AccountId;
    amount: bigint;
    domain: string;
    requestTransaction: (tx: MidenTransaction) => Promise<string>;
}


/**
 * Encodes a name string into a Word for storage in the registry.
 *
 * Names are packed into a single Word (4 Felts) with the following layout:
 * - Felt[0]: Name length
 * - Felt[1-3]: ASCII characters, 7 characters per Felt (56 bits used per Felt)
 *
 * @param name - The name string to encode (max 20 characters, ASCII only)
 * @returns A Word containing the encoded name
 * @throws {Error} If the name exceeds 20 characters
 *
 * Format: Word: `[length, chars_1-7, chars_8-14, chars_15-20]`
 */
export function encodeNameToWord(name: string): Word {
    if (name.length > 20) {
        throw new Error("Name must not exceed 20 characters");
    }

    const felts: Felt[] = [
        new Felt(0n),
        new Felt(0n),
        new Felt(0n),
        new Felt(0n),
    ];

    // Felt[0]: Store name length
    felts[0] = new Felt(BigInt(name.length));

    // Convert string to bytes (ASCII)
    const bytes = new TextEncoder().encode(name);

    // Felt[1-3]: Pack 7 ASCII characters per felt (56 bits used)
    for (let i = 0; i < 3; i++) {
        const start = i * 7;
        const end = Math.min(start + 7, bytes.length);
        const chunk = bytes.slice(start, end);

        let value = 0n;
        for (let j = 0; j < chunk.length; j++) {
            value |= BigInt(chunk[j]) << BigInt(j * 8);
        }
        felts[i + 1] = new Felt(value);
    }

    return Word.newFromFelts(felts);
}

/**
 * Example function for note transactions using a MASM script
 *
 * @param senderAccountId - The connected wallet's account ID (from useWallet hook)
 * @param faucetId - The faucet account ID to source tokens from (defaults to Miden testnet faucet)
 * @param amount - Amount of tokens to transfer (in base units, e.g., BigInt(50))
 * @param requestTransaction - Function to request transaction signing from the miden-wallet-adapter
 * @returns Transaction ID and Note ID string that can be used to view on MidenScan
 * @throws {Error} If transfer fails
 */
export async function registerName({
    senderAccountId,
    destinationAccountId,
    faucetId,
    amount,
    domain,
    requestTransaction,
}: NoteFromMasmParams): Promise<{ txId: string; noteId: string }> {
    if (typeof window === "undefined") {
        console.warn("webClient() can only run in the browser");
        return { txId: "N/A", noteId: "N/A" };
    }

    try {
        const client = await instantiateClient({ accountsToImport: [senderAccountId, destinationAccountId] })
        console.log("registerName Current block number: ", (await client.syncState()).blockNum());


        let assembler = TransactionKernel.assembler();

        let registerComponentLib = AssemblerUtils.createAccountComponentLibrary(
            assembler,
            "miden_id::registry",
            MIDEN_ID_CONTRACT_CODE
        );

        let script = assembler.withDebugMode(true)
            .withLibrary(registerComponentLib)
            .compileNoteScript(REGISTER_NOTE_SCRIPT);

        // Sync state to get latest blockchain data
        await client.syncState();

        // Create a new serial number for the note
        const serialNumber = generateRandomSerialNumber();

        const noteType = NoteType.Public;
        const domainWord = encodeNameToWord(domain);

        const assets = new FungibleAsset(faucetId, amount);
        const noteAssets = new NoteAssets([assets]);
        const noteTag = NoteTag.fromAccountId(destinationAccountId);

        const noteMetadata = new NoteMetadata(
            senderAccountId,
            noteType,
            noteTag,
            NoteExecutionHint.always(),
            new Felt(BigInt(0))
        );

        const noteInputs = new NoteInputs(
            new FeltArray([
                domainWord.toFelts()[3],
                domainWord.toFelts()[2],
                domainWord.toFelts()[1],
                domainWord.toFelts()[0],
            ])
        );

        const note = new Note(
            noteAssets,
            noteMetadata,
            new NoteRecipient(serialNumber, script, noteInputs)
        );

        const noteId = note.id().toString();

        let transactionRequest = new TransactionRequestBuilder()
            .withOwnOutputNotes(new OutputNotesArray([OutputNote.full(note)]))
            .build();

        await client.syncState();

        // let txResult = await client.newTransaction(senderAccountId, transactionRequest)

        // await client.submitTransaction(txResult)

        const tx = new CustomTransaction(
            accountIdToBech32(senderAccountId), // from
            accountIdToBech32(destinationAccountId), // to
            transactionRequest,
            [],
            [],
        );

        const txId = await requestTransaction({
            type: TransactionType.Custom,
            payload: tx,
        });

        console.log("Transaction submitted. ID:", txId, "Note ID:", noteId);

        return { txId, noteId };
    } catch (error) {
        console.error("Note transaction failed:", error);
        throw new Error("Note transaction failed");
    }
}
