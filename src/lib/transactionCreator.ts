import {
    AccountId,
    FungibleAsset,
    Note,
    NoteArray,
    NoteAssets,
    NoteMetadata,
    NoteRecipient,
    NoteStorage,
    NoteTag,
    NoteType,
    NoteScript,
    NetworkAccountTarget,
    TransactionRequestBuilder,
    MidenClient
} from '@miden-sdk/miden-sdk';
import {
    CustomTransaction,
    type MidenTransaction,
    TransactionType,
} from "@miden-sdk/miden-wallet-adapter";
import { generateRandomSerialNumber, accountIdToBech32 } from "./midenClient";
import { executeStep } from '@/utils/errorHandler';
import { ErrorCodes } from '@/types/errors';
import { base64ToUint8Array } from '@/utils';
import { REGISTER_NOTE_SCRIPT_COMPILED_B64 } from '@/shared/notes/register-note-compiled';

export interface NoteFromMasmParams {
    client: MidenClient
    senderAccountId: AccountId;
    destinationAccountId: AccountId;
    noteScript: string;
    libraryScript: string;
    libraryName: string;
    noteStorage: NoteStorage;
    faucetId: AccountId;
    amount: bigint;
    requestTransaction: (tx: MidenTransaction) => Promise<string>;
    waitForTransaction: (txId: string, timeout?: number) => Promise<{ txHash: string }>;
}


/**
 * Example function for note transactions using a MASM script
 *
 * @param senderAccountId - The connected wallet's account ID (from useWallet hook)
 * @param destinationAccountId - The account ID to send the note to (smart contract's ID)
 * @param noteScript - The MASM note script as a string
 * @param libraryScript - The MASM library script as a string
 * @param libraryName - The name of the library to link in the script (e.g., "miden_id::registry")
 * @param noteStorage - The inputs to pass to the note script
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
    // `client` is still accepted for call-site compatibility but no longer used: the
    // note script now always comes from the pre-compiled bytes rather than being
    // assembled through the client.
    senderAccountId,
    destinationAccountId,
    noteScript,
    libraryScript,
    libraryName,
    noteStorage,
    faucetId,
    amount,
    requestTransaction,
    waitForTransaction,
}: NoteFromMasmParams): Promise<{ txId: string; noteId: string, blockNumber?: number }> {
    if (typeof window === "undefined") {
        console.warn("webClient() can only run in the browser");
        return { txId: "N/A", noteId: "N/A" };
    }

    try {

        const script = await executeStep(
            ErrorCodes.SCRIPT_BUILDER_AND_COMPILER,
            "Script builder or compiler",
            async () => {
                // Prefer the deploy-compiled note script: its MAST root matches the
                // registry's NetworkAccountNoteAllowlist, so the network auto-consumes
                // the note. Recompiling from source in the frontend yields a DIFFERENT
                // root (different bundled std-libs) and the note is silently ignored.
                if (REGISTER_NOTE_SCRIPT_COMPILED_B64) {
                    return NoteScript.deserialize(
                        base64ToUint8Array(REGISTER_NOTE_SCRIPT_COMPILED_B64)
                    );
                }

                // No source fallback against the Rust registry. The remaining MASM
                // source (REGISTER_NOTE_SCRIPT / MIDEN_NAME_CONTRACT_CODE) describes
                // the *assembly* contract — a different contract, with a different
                // note layout — so compiling it here would build a note the registry
                // can never consume. It would sit COMMITTED forever with the user's
                // payment locked inside it. Failing loudly is the safer outcome.
                void noteScript;
                void libraryScript;
                void libraryName;
                throw new Error(
                    'REGISTER_NOTE_SCRIPT_COMPILED_B64 is empty. Regenerate it from the ' +
                    'contracts repo: cargo run -p integration --release --bin export-frontend',
                );
            }
        )

        // Create a new serial number for the note
        const serialNumber = generateRandomSerialNumber();

        const note = await executeStep(
            ErrorCodes.NOTE_CREATION,
            "Note creation",
            () => {
                const noteType = NoteType.Public

                const assets = new FungibleAsset(faucetId, amount);
                const noteAssets = new NoteAssets([assets]);
                const noteTag = NoteTag.withAccountTarget(destinationAccountId);

                const noteMetadata = new NoteMetadata(
                    senderAccountId,
                    noteType,
                    noteTag
                );

                // 0.15.5: mark this as a NETWORK note (`NetworkAccountTarget`
                // attachment) so the node's ntx-builder classifies it and the
                // public network account at `destinationAccountId` auto-consumes
                // it. Without the attachment `isNetworkNote()` is false and the
                // note stays COMMITTED forever. Requires `destinationAccountId`
                // to be a public account.
                const networkTarget = new NetworkAccountTarget(destinationAccountId);

                const note = Note.withAttachments(
                    noteAssets,
                    noteMetadata,
                    new NoteRecipient(serialNumber, script, noteStorage),
                    [networkTarget.toAttachment()]
                );
                return note
            }
        )

        const noteId = note.id().toString();

        const transactionRequest = await executeStep(
            ErrorCodes.TRANSACTION_REQ_CREATION,
            "Failed to create transaction request",
            () => {
                const noteArray = new NoteArray([note]);

                const transactionRequest = new TransactionRequestBuilder()
                    .withOwnOutputNotes(noteArray)
                    .build();

                return transactionRequest
            }
        )

        const txId = await executeStep(
            ErrorCodes.TRANSACTION_SUBMIT,
            "Failed to submit the transaction",
            async () => {
                const tx = new CustomTransaction(
                    accountIdToBech32(senderAccountId), // from
                    accountIdToBech32(destinationAccountId), // to
                    transactionRequest,
                    [],
                    [],
                );

                // 0.15 wallet-adapter: requestTransaction only ACKNOWLEDGES the
                // request and returns a handle (a UUID), not the on-chain tx hash.
                // The wallet proves + submits asynchronously; waitForTransaction
                // resolves that handle to the committed result (real txHash).
                const requestId = await requestTransaction({
                    type: TransactionType.Custom,
                    payload: tx,
                });

                const output = await waitForTransaction(requestId);

                return output.txHash
            }
        )

        return { txId, noteId };
    } catch (error) {
        console.error("Transaction Creation failed:", error);
        throw new Error("Transaction Creation failed");
    }
}
