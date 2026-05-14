/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRef, type ReactNode } from "react";

export function MidenNameProvider({
  children: _children,
}: { children: ReactNode }) {
  const _lastSyncTime = useRef(0);
  void _lastSyncTime;
}