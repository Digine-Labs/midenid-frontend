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

export interface NoteFromMasmParams {
    senderAccountId: AccountId;
    destinationAccountId: AccountId;
    noteScript: string;
    libraryScript: string;
    libraryName: string;
    noteInputs: NoteInputs;
    faucetId: AccountId;
    amount: bigint;
    requestTransaction: (tx: MidenTransaction) => Promise<string>;
}


/**
 * Example function for note transactions using a MASM script
 *
 * @param senderAccountId - The connected wallet's account ID (from useWallet hook)
 * @param destinationAccountId - The account ID to send the note to (smart contract's ID)
 * @param noteScript - The MASM note script as a string
 * @param libraryScript - The MASM library script as a string
 * @param libraryName - The name of the library to link in the script (e.g., "miden_id::registry")
 * @param noteInputs - The inputs to pass to the note script
 * @param faucetId - The faucet account ID to source tokens from (defaults to Miden testnet faucet)
 * @param amount - Amount of tokens to transfer (in base units, e.g., BigInt(50))
 * @param requestTransaction - Function to request transaction signing from the miden-wallet-adapter
 * @returns Transaction ID and Note ID string that can be used to view on MidenScan
 * @throws {Error} If transfer fails
 * 
 * 
 * @example
 * ```ts
 * const noteInputs = new NoteInputs(
 *  new FeltArray([
 *      domainWord.toFelts()[0],
 *      domainWord.toFelts()[1],
 *      domainWord.toFelts()[2],
 *      domainWord.toFelts()[3],
 *      ])
 *  );
 * 
 * const { txId, noteId } = await transactionCreator({
 * senderAccountId,
 * destinationAccountId,
 * noteScript: REGISTER_NOTE_SCRIPT,
 * libraryScript: MIDEN_ID_CONTRACT_CODE,
 * libraryName: "miden_id::registry",
 * noteInputs,
 * faucetId,
 * amount: BigInt(100),
 * requestTransaction,
 * });
 * 
 * ```
 * 
 */
export async function transactionCreator({
    senderAccountId,
    destinationAccountId,
    noteScript,
    libraryScript,
    libraryName,
    noteInputs,
    faucetId,
    amount,
    requestTransaction,
}: NoteFromMasmParams): Promise<{ txId: string; noteId: string }> {
    if (typeof window === "undefined") {
        console.warn("webClient() can only run in the browser");
        return { txId: "N/A", noteId: "N/A" };
    }

    try {
        const client = await instantiateClient({ accountsToImport: [senderAccountId, destinationAccountId] })

        const builder = client.createScriptBuilder();

        let registerComponentLib = builder.buildLibrary(libraryName, libraryScript)

        builder.linkDynamicLibrary(registerComponentLib)

        let script = builder.compileNoteScript(noteScript)

        // Sync state to get latest blockchain data
        await client.syncState();

        // Create a new serial number for the note
        const serialNumber = generateRandomSerialNumber();

        const noteType = NoteType.Public

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

        const note = new Note(
            noteAssets,
            noteMetadata,
            new NoteRecipient(serialNumber, script, noteInputs)
        );

        const noteId = note.id().toString();

        const noteArray = new MidenArrays().OutputNoteArray([OutputNote.full(note)]);

        let transactionRequest = new TransactionRequestBuilder()
            .withOwnOutputNotes(noteArray)
            .build();

        await client.syncState();

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

        client.terminate()

        return { txId, noteId };
    } catch (error) {
        console.error("Note transaction failed:", error);
        throw new Error("Note transaction failed");
    }
}
