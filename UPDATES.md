# Updates — Miden ID Frontend

This doc captures a deep comparison between our frontend and [zoroswap/frontend](https://github.com/zoroswap/frontend) (cloned locally at `/home/erim/Projects/frontend`), specifically aimed at understanding why their dApp doesn't surface the testnet sync errors we hit during the v0.13 → v0.14 transition. It then lists architectural differences and a prioritized improvement backlog.

---

## Key finding: SDK lineage is different

We are not using the same SDK as Zoro.

| | This project | Zoro |
| --- | --- | --- |
| npm package | `@miden-sdk/miden-sdk` ^0.14.4 | `@demox-labs/miden-sdk` 0.10.1 (patched) |
| Client class | `MidenClient` (resource API: `client.accounts.get`, `client.sync()`) | `WebClient` (flat API: `client.getAccount`, `client.syncState()`) |
| Bootstrap call we use | `MidenClient.createTestnet()` | `WebClient.createClient(rpcUrl)` |
| Includes background autoSync? | **Yes** (`createTestnet` preset enables `autoSync` per [api-types.d.ts:915-923](node_modules/@miden-sdk/miden-sdk/dist/api-types.d.ts#L915-L923)) | No |

`autoSync` triggers a sync immediately on creation, and the `createTestnet` preset wires it on. That's almost certainly the source of the `failed to sync state: storage error: merkle store error: root Word(...) is not in the store` lines we see in the console — they appear seconds after the client is constructed, with no read having been issued. Zoro's `WebClient.createClient(rpcUrl)` does not auto-sync; sync only happens when their throttled accessor decides to.

---

## How Zoro handles testnet noise (concrete patterns)

Based on a deep read of `/home/erim/Projects/frontend/src/`, ordered by likely contribution to UX cleanliness:

1. **No background autoSync** — `WebClient.createClient(NETWORK.rpcEndpoint)` ([utils.ts:23](/home/erim/Projects/frontend/src/lib/utils.ts#L23)) only syncs once, after manual `importAccountById` calls, and only at provider startup.
2. **Throttled sync (1.5s floor)** in [ZoroProvider.tsx:11,60-67](/home/erim/Projects/frontend/src/providers/ZoroProvider.tsx). Every read goes through `throttledSync()`; back-to-back reads share one sync.
3. **Single global mutex** ([clientMutex.ts](/home/erim/Projects/frontend/src/lib/clientMutex.ts)) via the `async-mutex` package — every WebClient call is serialized. Prevents concurrent WASM access that can corrupt internal merkle state.
4. **`safeAccountImport` guard** ([utils.ts:39-48](/home/erim/Projects/frontend/src/lib/utils.ts#L39-L48)): checks `getAccount()` before `importAccountById()`. Avoids re-imports and their associated errors.
5. **Per-operation try/catch surfaces errors as toasts** — e.g. [useSwap.tsx:61-70](/home/erim/Projects/frontend/src/hooks/useSwap.tsx#L61-L70). Errors are *user-visible*, never silently retried. No cascading failures from buried promises.
6. **TanStack Query for static data** (`@tanstack/react-query` ^5.90.12 in their `package.json`). `usePoolsInfo` uses `staleTime: 3600000` — pool config cached for 1 hour, decoupling network-light reads from sync-heavy account reads.
7. **Bech32 round-trip discipline** ([utils.ts:28-29](/home/erim/Projects/frontend/src/lib/utils.ts#L28-L29)): always `accountId.toBech32(...).then(Address.fromBech32(...).accountId())` to ensure the AccountId originates from the same SDK module instance that the client expects.
8. **`AccountInterface.BasicWallet` everywhere** when going to/from bech32. Avoids "wrong interface" decode failures.
9. **WASM async-init patch** at `/home/erim/Projects/frontend/patches/@demox-labs+miden-sdk+0.10.1.patch`. Wraps the SDK's `await __wbg_init(...)` in an IIFE to defuse a StrictMode double-render race. Specific to their 0.10.1 SDK; the newer `@miden-sdk/miden-sdk` already mitigates this.
10. **Wallet isolation**: Para wallet users get Para's own managed client via `useParaMiden`; Miden-wallet users get the local `WebClient`. Each path fails independently. (Not relevant to us — we only support Miden wallet.)

---

## Differences between Zoro and us

### What we already match
- 1.5s throttled sync ([src/providers/MidenClientProvider.tsx:19,47-58](src/providers/MidenClientProvider.tsx#L19-L58)).
- Mutex serialization (homegrown FIFO in [src/lib/clientMutex.ts](src/lib/clientMutex.ts) instead of the `async-mutex` package).
- `safeAccountImport` ([src/lib/midenClient.ts:56-64](src/lib/midenClient.ts#L56-L64)).
- Best-effort sync that swallows errors and continues (our addition; Zoro doesn't need it because their sync is rarely the failing component).

### Where they have more than us
- **TanStack Query** for any kind of caching/dedup/retry. We re-trigger reads on every render/keystroke via `useEffect`.
- **`AccountInterface` discipline** when round-tripping bech32. We use `Address.fromBech32(addr).accountId()` directly; works for now, but is brittle if multiple SDK module instances coexist.
- **A `createNetworkId()` helper** that builds a fresh `NetworkId` on every call ([config.ts:74-86 (Zoro)](/home/erim/Projects/frontend/src/lib/config.ts)). NetworkIds in the SDK can be consumed; reusing one across calls is a documented footgun.
- **An RPC client** exposed alongside the WebClient ([ZoroProvider.tsx:31-36](/home/erim/Projects/frontend/src/providers/ZoroProvider.tsx#L31-L36)) for raw RPC reads independent of the store. Useful for "I just want a value, don't import anything" queries.

### Where we have more than them
- **Eager client init at app mount** — search works for unauthenticated visitors. Zoro waits for wallet connect.
- **On-chain availability check** via `account.storage().getMapItem('naming::domain_to_owner', ...)`. Zoro fetches pool info from a REST `/pools/info` endpoint — they don't read contract storage directly.
- **`AccountId.isPrivate()` routing for balance** — newer SDK API. Lets us auto-fetch for public/network accounts without `requestAssets` friction.
- **Domain-encoding utilities** for the naming contract's bespoke Word format.

---

## Recommended improvements (prioritized)

### Tier 1 — Likely silences the testnet noise (do first)

**1.1 Switch `MidenClient.createTestnet()` → `MidenClient.create({ ..., autoSync: false })`**

In [src/lib/midenClient.ts:32,39](src/lib/midenClient.ts#L32):
```ts
client = await MidenClient.create({
  rpcUrl: 'testnet',
  noteTransportUrl: 'testnet',
  autoSync: false,
});
```
This disables the background sync that's hammering merkle-state lookups during the testnet transition. Our explicit `client.sync()` calls remain (already wrapped in try/catch), so functionality is unchanged — we just stop the SDK from syncing under us. **Single highest-leverage change in this doc.**

**1.2 Add a self-heal path on persistent sync failures**

If `client.sync()` fails the same way twice in a row, clear IndexedDB and reinstantiate the client once per session. The existing `clearMidenIndexedDB` helper already exists at [src/lib/midenClient.ts:16-24](src/lib/midenClient.ts#L16-L24) — just expand the trigger patterns from `Indexdb|WebStore|primary key` to also include `merkle store error` and `account data wasn't found`.

### Tier 2 — UX / architecture upgrades

**2.1 Adopt `@tanstack/react-query` for chain reads**
Wrap `getDomainOwner` and `getUserBalance` in `useQuery`. Wins:
- Same domain typed twice in a row → one chain hit, not two.
- `staleTime` + `refetchOnWindowFocus` → users coming back to the tab see fresh data without us writing custom polling.
- `retry: 2` with exponential backoff → transient testnet failures self-recover.
- One `<QueryClientProvider>` at the app root; minimal blast radius.

**2.2 Expose `userAccountId.isPrivate()` UX everywhere**
We already do this in `RegistrationStep` (auto-fetch when non-private). The same logic should gate any future "show balance in header" or "list my notes" UI — public/network accounts shouldn't ever see a "Connect/Approve" wallet prompt for read operations.

**2.3 Wallet/sync health banner**
A subtle inline indicator (top of the page) when the client is in a degraded state (`error` set on the provider, or N consecutive sync failures). Today these errors only show in dev tools; users see "Network Delay" toasts and no remediation. The banner can link to a "reset cache" action that calls the Tier 1.2 self-heal.

### Tier 3 — Robustness / polish

**3.1 `AccountInterface.BasicWallet` discipline**
When constructing AccountIds from bech32 strings (currently `Address.fromBech32(addr).accountId()`), explicitly include the interface to avoid module-instance ambiguity. Low cost, fixes a class of bug we haven't hit yet.

**3.2 Swap our inline mutex for `async-mutex`**
Functional parity, but `async-mutex` is battle-tested and supports timeouts/release semantics we'd want for a "cancel in-flight balance read on modal close" feature later.

**3.3 RPC client accessor on the provider**
Mirror Zoro's `rpcClient` ([ZoroProvider.tsx:31-36](/home/erim/Projects/frontend/src/providers/ZoroProvider.tsx#L31-L36)) so future features can do "just fetch this single value, don't touch the store". Two-line addition.

**3.4 Background prefetch of the registry account at app boot**
Today the registry account is imported on first availability check (~10s slow toast appears). Doing `getOrImport(registryId)` in the provider's init effect (after `instantiateClient` resolves) would make the first availability check feel instant.

---

## Out of scope (decided against)

- **Para wallet support** — different product scope; we only support the Miden wallet adapter.
- **Downgrading to `@demox-labs/miden-sdk`** — committed to the newer SDK. The fixes above stay within 0.14.
- **Suppressing the SDK's worker-level error logs** — those are useful for debugging; the right fix is to stop triggering them (Tier 1.1), not silence them.
- **Eagerly re-routing every backend call** — already decided to keep profile/NFT APIs on the backend per [Tier 1 cleanup in this session].

---

## Open questions to validate before shipping Tier 1

- Does `autoSync: false` break the transaction submission flow? `transactionCreator` may rely on an up-to-date state when building note inputs. Mitigation: keep our explicit `await client.sync()` inside `transactionCreator` (best-effort wrapped) so the submitter has fresh data right before signing, without leaving a background sync running the whole time.
- Does `MidenClient.create({ rpcUrl: 'testnet', ... })` configure the prover correctly? `createTestnet` also presets `proverUrl: 'testnet'`. Check the resulting `ClientOptions` and pass `proverUrl: 'testnet'` explicitly if needed.
