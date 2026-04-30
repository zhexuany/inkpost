declare module 'mathjax-node' {
  export function config(options: any): void;
  export function typeset(options: any, callback: (result: any) => void): void;
}
