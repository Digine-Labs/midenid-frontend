import {
    WebClient,
    AccountId,
    NoteType,
    Note,
    NoteAssets,
    OutputNotesArray,
    Felt,
    FungibleAsset,
    TransactionRequestBuilder,
    OutputNote,
} from "@demox-labs/miden-sdk"
import { bech32ToAccountId, accountIdToBech32 } from "./midenClient"
import { CustomTransaction, TransactionType, type MidenTransaction } from "@demox-labs/miden-wallet-adapter"

// Constants
const MIDEN_FAUCET_ID_BECH32 = "mtst1qzp4jgq9cy75wgp7c833ynr9f4cqzraplt4"
const DESTINATION_ACCOUNT_BECH32 = "mtst1qr8ewt8029zdwypcqzxchjdcgdcqq7sqaxk"

interface TransferNoteParams {
    client: WebClient
    senderAccountId: AccountId
    amount: bigint
    requestTransaction: (tx: MidenTransaction) => Promise<string>
}

/**
 * Transfers tokens from the connected wallet to a fixed destination account
 * Uses the existing Miden testnet faucet
 *
 * @param client - WebClient instance from useMidenClient hook
 * @param senderAccountId - The connected wallet's account ID (from useWallet hook)
 * @param amount - Amount of tokens to transfer (in base units, e.g., BigInt(50))
 * @returns Transaction ID string that can be used to view on MidenScan
 * @throws {Error} If transfer fails
 */
export async function transferNote({
    client,
    senderAccountId,
    amount,
    requestTransaction
}: TransferNoteParams): Promise<string> {
    try {
        console.log("Starting transfer...")
        console.log("Sender:", senderAccountId.toString())
        console.log("Amount:", amount.toString())

        // Sync state to get latest blockchain data
        // Temporarily disabled due to RPC sync issues
        // await client.syncState()

        // Get faucet and destination account IDs
        const faucetId = bech32ToAccountId(MIDEN_FAUCET_ID_BECH32)
        const destinationAccountId = bech32ToAccountId(DESTINATION_ACCOUNT_BECH32)

        // Create fungible asset with the specified amount
        const assets = new NoteAssets([
            new FungibleAsset(faucetId, amount)
        ])

        // Create P2ID (Pay to ID) note
        const p2idNote = Note.createP2IDNote(
            senderAccountId,
            destinationAccountId,
            assets,
            NoteType.Public,
            new Felt(BigInt(0)), // aux value
        )

        const outputP2ID = OutputNote.full(p2idNote)

        // Build and submit transaction
        let transactionRequest =
            new TransactionRequestBuilder()
                .withOwnOutputNotes(new OutputNotesArray([outputP2ID]))
                .build()


        console.log(transactionRequest)

        const tx = new CustomTransaction(accountIdToBech32(senderAccountId), accountIdToBech32(destinationAccountId), transactionRequest, [], [])

        const txId = await requestTransaction({ type: TransactionType.Custom, payload: tx })

        // Sync after transaction - temporarily disabled due to RPC sync issues
        // await client.syncState();

        console.log(`Transfer successful! Tx ID: ${txId.toString()}`)
        console.log(`View on MidenScan: https://testnet.midenscan.com/tx/${txId}`)

        return txId
    } catch (error) {
        console.error("Transfer failed:", error)
        throw new Error(`Transfer failed: ${error instanceof Error ? error.message : String(error)}`)
    }
}

