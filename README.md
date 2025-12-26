# Miden ID Frontend

A decentralized identity and domain name registration system built on the Miden blockchain. This frontend application allows users to register `.miden` domains, manage their digital identity, and connect their social profiles in a Web3 environment.

## Overview

Miden ID is a blockchain-based naming service that enables users to:
- Register and manage `.miden` domain names
- Create decentralized identity profiles linked to their domains
- Connect social media accounts (Twitter, GitHub, Discord, Telegram)
- Manage multiple domains with wallet integration
- Sign profile data with cryptographic verification

## Features

### Domain Registration
- **Real-time Domain Search**: Instant availability checking for `.miden` domains
- **Multi-step Registration Flow**: Clear visual feedback throughout the registration process
- **Domain Validation**: Supports 1-20 character alphanumeric domain names

### Identity Management
- **Profile Customization**: Add bio (up to 280 characters), social links, and profile images
- **Wallet-based Authentication**: Cryptographic signature verification for profile updates
- **Multi-domain Support**: Switch between and manage multiple registered domains
- **Profile Privacy**: Delete profile data while retaining domain ownership

### User Experience
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Dark/Light Theme**: System-aware theme with manual toggle
- **Real-time Notifications**: Toast notifications for user actions and feedback
- **Loading States**: Clear indicators for async operations
- **Error Handling**: Comprehensive error messages and recovery options

## Tech Stack

### Frontend Framework
- **React 19.1.1** - Modern UI framework with hooks
- **TypeScript 5.8.3** - Type-safe development
- **Vite 7.1.2** - Fast build tool and dev server
- **React Router 7.9.3** - Client-side routing

### Blockchain Integration
- **Miden SDK 0.12.5** - Miden protocol integration
- **Miden Wallet Adapter** - Wallet connectivity and transaction signing
- **MASM Smart Contracts** - On-chain domain registration logic

### UI Components
- **shadcn/ui** - High-quality React component library
- **Radix UI** - Accessible headless UI primitives
- **Tailwind CSS 3.4.13** - Utility-first styling
- **Lucide React** - Icon library
- **Framer Motion** - Smooth animations

### Form Management
- **React Hook Form 7.64.0** - Performant form handling
- **Zod 4.1.12** - TypeScript-first schema validation
- **@hookform/resolvers** - Validation integration

### Development Tools
- **Vitest** - Fast unit testing
- **Playwright** - End-to-end testing
- **ESLint** - Code quality and linting
- **Husky** - Git hooks for pre-commit checks

## Project Structure

```
src/
├── api/                          # Backend API integration
│   ├── accounts.ts              # Account and domain lookups
│   ├── domains.ts               # Domain resolution
│   ├── profile.ts               # Profile CRUD operations
│   ├── metadata.ts              # Domain metadata management
│   └── types.ts                 # API response interfaces
├── components/                   # Reusable React components
│   ├── ui/                      # shadcn/ui components
│   ├── register-modal/          # Domain registration workflow
│   ├── site-header.tsx          # Navigation header
│   └── theme-provider.tsx       # Theme management
├── contexts/                     # React Context providers
│   ├── WalletAccountContext.tsx # Wallet and account state
│   └── DomainRegistrationContext.tsx # Registration callbacks
├── hooks/                        # Custom React hooks
├── lib/                          # Utility libraries
│   ├── midenClient.ts           # Miden client management
│   └── transactionCreator.ts    # Transaction signing
├── pages/                        # Route components
│   ├── home/                    # Domain search/registration
│   ├── identity/                # Profile management
│   ├── myDomains/               # Domain listing
│   └── not-found/               # 404 page
├── shared/                       # Shared constants and contracts
│   ├── constants.ts             # Contract addresses, API endpoints
│   ├── pricing.ts               # Domain pricing config
│   ├── contracts/               # MASM smart contracts
│   └── notes/                   # Transaction note scripts
└── utils/                        # Helper functions
    ├── encode.ts                # Domain name encoding
    ├── decode.ts                # Domain name decoding
    └── format.ts                # Formatting utilities
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Miden wallet (for blockchain interactions)
- Access to Miden testnet

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

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run test:ui` | Open Vitest UI dashboard |
| `npm run test:run` | Run tests once (CI mode) |

## Configuration

### Environment Variables

The application connects to:
- **Miden Testnet RPC**: `https://rpc.testnet.miden.io`

### Smart Contract Addresses

- **Miden ID Contract**: `0xf090f55f132c11405c162476ac8469`
- **Miden Faucet**: `0x54bf4e12ef20082070758b022456c7`

Update these in `src/shared/constants.ts` if needed.

## Architecture

### State Management

The application uses React Context for state management:

- **WalletAccountContext**: Manages wallet connection, account ID, and owned domains
- **DomainRegistrationContext**: Handles registration completion callbacks

### Routing

Client-side routing powered by React Router v7:

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Domain search and registration |
| `/identity` | Identity | Profile editor (requires domain) |
| `/my-domains` | MyDomains | List of owned domains |
| `/*` | NotFound | 404 error page |

### Domain Encoding

Domain names are encoded into Miden's `Word` format (4 Felts) for blockchain storage:
- Characters `a-z` map to values 1-26
- Characters `0-9` map to values 27-36
- Maximum 20 characters supported
- Packed efficiently for on-chain storage

### Transaction Flow

1. User initiates domain registration
2. Frontend creates MASM transaction note with domain data
3. Miden wallet signs and approves the transaction
4. Transaction submitted to Miden blockchain
5. Frontend polls for confirmation (up to 75 seconds)
6. On success, domain metadata is saved to backend database
7. Wallet context refreshes to include new domain

## API Integration

The frontend communicates with a backend API for:

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/accounts/{id}` | GET | Get active domain for account |
| `/accounts/{id}/domains` | GET | Get all domains for account |
| `/domains/{domain}` | GET | Resolve domain to account ID |
| `/metadata/domains/{domain}/profile` | GET/POST/DELETE | Profile CRUD |
| `/metadata/domains/{domain}/enriched` | GET | Get domain with profile data |

All profile modifications require cryptographic signatures for verification.

## Development

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Husky for pre-commit hooks
- Consistent component structure (functional components with hooks)

### Testing

```bash
# Run unit tests
npm run test

# Run with UI
npm run test:ui

# Run in browser mode
npm run test:browser
```

Tests are located in `src/utils/__tests__/` and cover:
- Domain encoding/decoding
- Formatting utilities
- Domain registry functions

### Component Development

Components follow shadcn/ui conventions:
- Use Tailwind CSS for styling
- Radix UI for accessible primitives
- TypeScript interfaces for props
- React Hook Form for forms

## Deployment

### Production Build

```bash
npm run build
```

Output is generated in the `dist/` directory with:
- Optimized bundles
- Code splitting (react, miden-wallet, ui, form vendors)
- Minified assets
- Tree-shaking applied

### Preview Production Build

```bash
npm run preview
```

## Pricing Structure

Domain pricing is character-based:

| Characters | Price/Year |
|------------|------------|
| 1 char | $375 |
| 2 chars | $250 |
| 3 chars | $125 |
| 4 chars | $50 |
| 5+ chars | $20 |

Prices are configured in `src/shared/pricing.ts`.

## Browser Support

- Modern browsers with ES2020+ support
- IndexedDB for Miden client state
- LocalStorage for theme preferences

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Guidelines

- Use conventional commits format
- Run linting before committing
- Ensure tests pass

## Security

- **Wallet Signatures**: All profile updates require cryptographic signatures
- **Input Validation**: Zod schemas validate all form inputs
- **XSS Prevention**: React's built-in escaping
- **HTTPS**: Production should use HTTPS for API calls

## Troubleshooting

### Wallet Connection Issues
- Ensure Miden wallet extension is installed
- Check that you're on Miden testnet
- Refresh the page and reconnect

### Domain Registration Failures
- Verify wallet has sufficient balance
- Check domain availability before registration
- Ensure domain name follows validation rules (1-20 alphanumeric chars)

### Profile Update Errors
- Confirm wallet is connected
- Check that you own the domain
- Verify signature approval in wallet

## Support

For issues and questions:
- Open an issue on GitHub
- Check documentation at [\[docs\]](https://docs.miden.name/docs/overview)
- Contact the development team

## Acknowledgments

- Miden blockchain team for the SDK
- shadcn for the UI component library
- Radix UI for accessible primitives
- The React and TypeScript communities

---

Built with ❤️ for the Miden ecosystem
