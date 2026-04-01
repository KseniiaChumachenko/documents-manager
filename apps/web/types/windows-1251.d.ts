declare module 'windows-1251' {
  export function decode(input: Uint8Array): string;
  export function encode(input: string): Uint8Array;
}
