# Miden.name

A decentralized identity system built on the Miden ecosystem, allowing users to register and manage `.miden` domain names.

## Overview

Miden.name provides a user-friendly interface for claiming and managing decentralized identities on the Miden network. Users can search for available `.miden` domain names, register them through wallet connection, and manage their on-chain identity.

The application leverages the Miden Wallet Adapter for seamless wallet integration and the Miden SDK for blockchain interactions, providing a complete frontend solution for decentralized identity management.

## Current Status

### ✅ Completed Features
- **Real-time domain availability checking** from smart contract storage (queries slot 3: Name → Account ID mapping)
- **Wallet connection and integration** with Miden Wallet Adapter
- **Domain registration flow** with real MASM-based smart contract transactions
- **Transaction receipt page** with Midenscan explorer links
- **Balance tracking** with auto-refresh (10-second intervals)
- **Wallet account context** with domain ownership checking
- **Domain encoding/decoding utilities** with full test coverage
- **Comprehensive test suite** using Vitest + Playwright
- **Responsive design** for mobile and desktop
- **Testnet warning modal**
- **Dark/light theme toggle**

### 🚧 In Progress
- **Identity Page**: UI implemented with form validation, blockchain integration pending

### 📋 Planned Features
- Migration to new contracts
- Domain transfer functionality
- Advanced identity profile management with blockchain storage
- Multi-domain management dashboard

## Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript + Vite 7
- **Routing**: React Router 7 (file-based routing)
- **Styling**: TailwindCSS with custom CSS variables
- **UI Components**: Radix UI primitives (Shadcn-style)
- **Blockchain**: Miden SDK (`@demox-labs/miden-sdk`)
- **Wallet**: Miden Wallet Adapter

### Project Structure

```
src/
├── components/          # Shared components
│   ├── ui/             # Reusable UI primitives (Button, Card, Input, etc.)
│   ├── site-header.tsx # Main navigation header with wallet & theme toggle
│   ├── theme-provider.tsx
│   └── ...
├── contexts/           # React contexts
│   └── WalletAccountContext.tsx # Wallet state & domain ownership
├── hooks/              # Custom React hooks
│   ├── useBalance.tsx  # Balance tracking with auto-refresh (10s intervals)
│   └── useStorage.tsx  # Smart contract storage queries
├── lib/                # Utilities and helpers
│   ├── midenClient.ts  # Miden SDK utilities (client instantiation, conversions)
│   ├── registerName.ts # Domain registration transaction logic
│   └── utils.ts        # General utilities
├── pages/              # Route pages
│   ├── home/           # Domain search with real-time availability
│   ├── register/       # Domain registration flow with wallet integration
│   │   └── receipt/    # Transaction success page with Midenscan links
│   ├── identity/       # User identity page (UI complete, blockchain pending)
│   └── not-found/      # 404 page
├── shared/             # Shared constants and configs
│   ├── constants.ts    # Contract addresses & configuration
│   ├── miden-contract.ts   # Registry contract MASM
│   ├── miden-naming.ts     # Naming contract MASM
│   └── miden-pricing.ts    # Pricing contract MASM
├── utils/              # Utility functions with test coverage
│   ├── encode.ts       # Domain name encoding to Word format
│   ├── decode.ts       # Domain name decoding from blockchain
│   ├── domain-registry.ts # Domain availability & ownership checks
│   └── __tests__/      # Comprehensive test suite (Vitest)
└── main.tsx            # App entry point with providers
```

### Key Features

**Provider Hierarchy**:
```
WalletProvider (Wallet connection via Miden Wallet Adapter)
  └─ WalletModalProvider (Wallet UI components)
      └─ WalletAccountProvider (Account state & domain ownership)
          └─ ThemeProvider (Dark/light mode)
              └─ App Routes
```

**Domain Pricing**:
- Base price: 1 MIDEN/year
- Registration periods: 1-10 years
- Pricing calculated dynamically based on selected duration

**Domain Validation**:
- Alphanumeric characters only (a-z, 0-9)
- Maximum 20 characters (both frontend and contract)
- Real-time validation with debouncing (500ms)

**Smart Contract Storage**:
- Registry Contract: `0xbcf3703152589f40689336e42bfbef`
- Faucet Contract: `0x83592005c13d47203ec1e3124c654d`
- Storage Layout:
  - Slot 3: Name → Account ID mapping (domain availability)
  - Slot 4: Account ID → Name mapping (ownership lookup)
- Domain names encoded into Words (4 Felts, 7 characters per Felt)
- Transactions use MASM note scripts compiled via AssemblerUtils

**Domain Availability Checking**:
- Queries smart contract storage slot 3 in real-time
- Uses `useStorage` hook to fetch blockchain state
- Encodes domain names with `encodeNameToWord()` utility
- Validates via `isDomainRegistered()` utility function

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Miden Wallet browser extension installed

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd midenid-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run browser tests
npm run test:browser
```

### Environment

The application currently connects to:
- **Testnet RPC**: `https://rpc.testnet.miden.io`
- **Transaction Prover**: `https://tx-prover.testnet.miden.io`
- **Block Explorer**: `https://testnet.midenscan.com`

> ⚠️ **Note**: This is a testnet deployment. All transactions and data are for testing purposes only.

## Testing

The project includes comprehensive test coverage using **Vitest** and **Playwright**.

### Test Coverage

- **Encoding Utilities** (`encode.test.ts`): 278 lines
  - Domain name encoding to Word format
  - Character mapping (a-z → 1-26, 0-9 → 27-36)
  - Multi-Felt packing (7 characters per Felt)
  - Edge cases and validation

- **Decoding Utilities** (`decode.test.ts`): 182 lines
  - Word to domain name decoding
  - Reverse character mapping
  - Validation of decoded output

- **Domain Registry** (`domain-registry.test.ts`): 168 lines
  - `isDomainRegistered()` - Domain availability checks
  - `hasRegisteredDomain()` - Ownership verification
  - `getOwnerFromStorageWord()` - Owner extraction
  - Storage slot handling

- **Format Utilities** (`format.test.ts`)
  - Formatting helpers and display utilities

### Running Tests

```bash
# Run all tests in watch mode
npm run test

# Run tests with Vitest UI
npm run test:ui

# Run tests once (for CI/CD)
npm run test:run

# Run browser tests with Playwright
npm run test:browser
```

## Key Components

### Hooks

- **`useStorage({ accountId, index, key })`** - Queries smart contract storage
  - Returns: `{ storageItem, storageHex, storageU64s, isLoading }`
  - Automatically syncs with blockchain state
  - Used for domain availability and ownership checks

- **`useBalance({ accountId, faucetId, client })`** - Fetches wallet balance
  - Returns: `bigint | null`
  - Auto-refreshes every 10 seconds
  - Used for displaying available MIDEN tokens

### Contexts

- **`WalletAccountContext`** - Centralizes wallet state
  - Provides: `accountId`, `hasRegisteredDomain`, `registeredDomain`, `balance`, `refetch()`
  - Automatically checks if connected wallet owns a domain
  - Decodes domain names from contract storage

### Utilities

- **`encodeNameToWord(name: string): Word`** - Encodes domain for storage
- **`decodeDomain(word: Word): string`** - Decodes domain from blockchain
- **`isDomainRegistered(storageWord?: Word): boolean`** - Checks availability
- **`hasRegisteredDomain(storageWord?: Word): boolean`** - Checks ownership
- **`bech32ToAccountId(bech32: string): AccountId`** - Converts wallet address
- **`accountIdToBech32(accountId: AccountId): string`** - Converts to Bech32

## Smart Contract Integration

The application integrates with two production MASM smart contracts:

2. **Naming Contract** (`miden-naming.ts` - 413 lines)
   - Domain name encoding/decoding
   - Name → Account ID mapping
   - Account ID → Name reverse lookup

3. **Pricing Contract** (`miden-pricing.ts` - 195 lines)
   - Price calculation logic
   - Payment processing
   - Subscription management

### Transaction Flow

1. User selects domain and registration period
2. Frontend compiles MASM note script via `AssemblerUtils.createAccountComponentLibrary()`
3. `CustomTransaction` created with fungible assets (MIDEN tokens)
4. Transaction submitted via `wallet.requestTransaction()`
5. Returns `txId` and `noteId` for tracking
6. Receipt page displays success with Midenscan explorer link
