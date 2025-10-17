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
import { encodeNameToWord } from './utils';

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
        const domainWord = encodeNameToWord(domain, true);

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
