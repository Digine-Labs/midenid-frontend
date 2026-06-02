export function createMutex() {
  let chain: Promise<unknown> = Promise.resolve();
  return {
    runExclusive<T>(fn: () => Promise<T>): Promise<T> {
      const result = chain.then(fn);
      chain = result.catch(() => undefined);
      return result;
    },
  };
}

export type Mutex = ReturnType<typeof createMutex>;
