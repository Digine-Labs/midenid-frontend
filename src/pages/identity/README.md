# Identity Page Components

This directory contains the identity management feature for the Miden.name name service project.

## Overview

The identity page provides a complete user experience for managing Miden identities with three distinct states:

1. **No Wallet Connected** - Shown when user hasn't connected their wallet
2. **No Domain Registered** - Shown when user has wallet connected but no domain
3. **Identity Profile** - Shown when user has a registered domain

## File Structure

```
identity/
├── page.tsx                    # Main page with conditional rendering logic
├── components/
│   ├── NoWalletConnected.tsx   # Component for non-connected state
│   ├── NoDomainRegistered.tsx  # Component for no domain state
│   ├── IdentityProfile.tsx     # Component for identity management
│   └── index.ts                # Barrel export file
└── README.md                   # This file
```

## Components

### 1. NoWalletConnected

**Purpose:** Prompts users to connect their Miden wallet.

**Features:**
- Centered card layout with wallet icon
- Clear call-to-action message
- WalletMultiButton for wallet connection
- Link to Miden wallet documentation

**Usage:**
```tsx
import { NoWalletConnected } from './components/NoWalletConnected';

<NoWalletConnected />
```

### 2. NoDomainRegistered

**Purpose:** Encourages users to register a domain.

**Features:**
- Centered card layout with globe icon
- Explanation of why to register a domain
- Two action buttons:
  - "Search for a Domain" - navigates to home page
  - "View My Domains" - navigates to my-domains page
- Benefits list for domain registration

**Usage:**
```tsx
import { NoDomainRegistered } from './components/NoDomainRegistered';

<NoDomainRegistered />
```

### 3. IdentityProfile

**Purpose:** Allows users to manage their Miden identity profile.

**Features:**
- Profile image upload (max 512x512px, 1MB)
- Image dimension validation
- Social media fields:
  - Twitter
  - GitHub
  - Discord
  - Telegram
- Domain information display:
  - Purchase date
  - Last modified date
- Form validation with Zod schema

**Props:**
```typescript
interface IdentityProfileProps {
  domainName?: string;           // User's registered domain
  domainPurchaseDate?: Date;     // Date when domain was purchased
  lastModifiedDate?: Date;       // Last modification date
}
```

**Usage:**
```tsx
import { IdentityProfile } from './components/IdentityProfile';

<IdentityProfile
  domainName="alice"
  domainPurchaseDate={new Date("2024-03-15")}
  lastModifiedDate={new Date()}
/>
```

## Main Page Logic

The [page.tsx](page.tsx) file handles conditional rendering based on wallet and domain status:

```tsx
// 1. Check wallet connection
if (!connected) {
  return <NoWalletConnected />;
}

// 2. Show loading state
if (isLoading) {
  return <LoadingSpinner />;
}

// 3. Check domain registration
if (!hasRegisteredDomain) {
  return <NoDomainRegistered />;
}

// 4. Show identity profile
return <IdentityProfile domainName={registeredDomain} />;
```

## Demo Page

A demo page is available at `/identity-demo` that allows you to preview all three components without needing actual wallet connection or domain registration.

**Access the demo:**
1. Start the dev server: `npm run dev`
2. Navigate to [http://localhost:5175/identity-demo](http://localhost:5175/identity-demo)
3. Use the control panel to switch between states

## Data Flow

```
User visits /identity
         ↓
WalletAccountContext checks:
  - Wallet connected?
  - Domain registered?
         ↓
Conditional rendering:
  - Not connected → NoWalletConnected
  - Loading → Loading spinner
  - No domain → NoDomainRegistered
  - Has domain → IdentityProfile
```

## Context Dependencies

The identity page uses the following context:

- **WalletAccountContext** - Provides:
  - `connected` - Wallet connection status
  - `hasRegisteredDomain` - Domain registration status
  - `registeredDomain` - User's registered domain name
  - `isLoading` - Loading state

## Blockchain Integration

### Current Status
- UI components are complete
- Form validation is implemented
- Identity profile submission is stubbed (see TODO in IdentityProfile.tsx)

### TODO
- Implement blockchain storage for profile data
- Add profile image storage (IPFS or similar)
- Implement domain purchase date fetching
- Implement last modified date tracking
- Add profile update transaction logic

## Styling

All components follow the project's design system:

- **Framework:** TailwindCSS
- **UI Components:** Radix UI primitives (shadcn/ui)
- **Theme:** Supports dark/light mode
- **Colors:** Miden brand green (#0FE046)
- **Layout:** Responsive (mobile, tablet, desktop)

## Navigation Flow

```
Home (/) ────────────────► Search domains
                            ↓ (if available)
                    RegisterModal
                            ↓ (after registration)
                    My Domains (/my-domains)
                            ↓
                    Identity (/identity)
                            ↓
                    IdentityProfile
```

## Testing

To test the components:

1. **No Wallet State:** Visit `/identity` without connecting wallet
2. **No Domain State:** Connect wallet without registering domain
3. **Profile State:** Register a domain then visit `/identity`
4. **Demo Mode:** Visit `/identity-demo` to preview all states

## Future Enhancements

- Social media verification
- Profile image hosting (IPFS)
- Multiple domain support
- Domain transfer UI
- Reverse record management
- ENS/Miden cross-chain identity
