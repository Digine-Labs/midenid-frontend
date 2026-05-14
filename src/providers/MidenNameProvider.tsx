/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRef, type ReactNode } from "react";

export function MidenNameProvider({
  children,
}: { children: ReactNode }) { 
  const lastSyncTime = useRef(0);
}