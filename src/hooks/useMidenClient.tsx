import { useEffect, useState } from 'react'
import { type AccountId, type WebClient } from '@demox-labs/miden-sdk'
import { instantiateClient } from '@/lib/utils'

export const useMidenClient = (accountId?: AccountId): WebClient | undefined => {
  const [client, setClient] = useState<WebClient | undefined>(undefined)

  useEffect(() => {
    console.log("new client")
    if (client == null && accountId != null) {
      (async () => {
        const newClient = await instantiateClient({
          accountsToImport: [accountId],
        })
        setClient(newClient)
      })()
    }
  }, [accountId, client])

  return client
}
