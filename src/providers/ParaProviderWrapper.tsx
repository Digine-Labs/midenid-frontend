// Para wallet integration — temporarily disabled (dependency issues)
// To re-enable: uncomment below and restore Para deps in package.json

// import { Environment, ParaProvider } from '@getpara/react-sdk-lite';
// import '@getpara/react-sdk-lite/styles.css';
// import type { ReactNode } from 'react';

// interface ParaProviderWrapperProps {
//   readonly children: ReactNode;
// }

// export function ParaProviderWrapper({ children }: ParaProviderWrapperProps) {
//   return import.meta.env.VITE_PARA_API_KEY
//     ? (
//       <ParaProvider
//         paraClientConfig={{
//           env: Environment.BETA,
//           apiKey: import.meta.env.VITE_PARA_API_KEY,
//         }}
//         config={{ appName: 'Miden.name' }}
//         externalWalletConfig={{ wallets: [] }}
//         paraModalConfig={{
//           oAuthMethods: ['GOOGLE', 'TWITTER', 'TELEGRAM'],
//           authLayout: ['AUTH:FULL'],
//           recoverySecretStepEnabled: true,
//         }}
//       >
//         {children}
//       </ParaProvider>
//     )
//     : children;
// }
