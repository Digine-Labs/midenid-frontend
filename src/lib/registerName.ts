import {
    AccountId,
    Felt,
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
    TransactionRequestBuilder,
    MidenArrays
} from '@demox-labs/miden-sdk';
import {
    CustomTransaction,
    type MidenTransaction,
    TransactionType,
} from "@demox-labs/miden-wallet-adapter-base";
import { generateRandomSerialNumber, accountIdToBech32, instantiateClient } from "./midenClient";
import { encodeDomainOld } from '@/utils';
import { MIDEN_ID_CONTRACT_CODE_OLD, REGISTER_NOTE_SCRIPT_OLD } from '@/shared';

export interface NoteFromMasmParams {
    senderAccountId: AccountId;
    destinationAccountId: AccountId;
    faucetId: AccountId;
    amount: bigint;
    domain: string;
    requestTransaction: (tx: MidenTransaction) => Promise<string>;
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

        const builder = client.createScriptBuilder();

        let registerComponentLib = builder.buildLibrary("miden_id::registry", MIDEN_ID_CONTRACT_CODE_OLD)

        builder.linkDynamicLibrary(registerComponentLib)

        let script = builder.compileNoteScript(REGISTER_NOTE_SCRIPT_OLD)

        await client.syncState();

        // Create a new serial number for the note
        const serialNumber = generateRandomSerialNumber();

        const noteType = NoteType.Public;
        const domainWord = encodeDomainOld(domain, true);

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
            new MidenArrays.FeltArray([
                domainWord.toFelts()[0],
                domainWord.toFelts()[1],
                domainWord.toFelts()[2],
                domainWord.toFelts()[3],
            ])
        );

        const note = new Note(
            noteAssets,
            noteMetadata,
            new NoteRecipient(serialNumber, script, noteInputs)
        );

        const noteId = note.id().toString();
        const noteArray = new MidenArrays.OutputNoteArray([OutputNote.full(note)]);

        const transactionRequest = new TransactionRequestBuilder()
            .withOwnOutputNotes(noteArray)
            .build();

        await client.syncState();

        const tx = new CustomTransaction(
            accountIdToBech32(senderAccountId),
            accountIdToBech32(destinationAccountId),
            transactionRequest,
            [],
            [],
        );

        const txId = await requestTransaction({
            type: TransactionType.Custom,
            payload: tx,
        });

        return { txId, noteId };
    } catch (error) {
        console.error("Note transaction failed:", error);
        throw new Error(`Note transaction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
