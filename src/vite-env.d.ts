/// <reference types="vite/client" />

declare module '*.masm' {
  const content: string;
  export default content;
}

declare module '*.masm?raw' {
  const content: string;
  export default content;
}
