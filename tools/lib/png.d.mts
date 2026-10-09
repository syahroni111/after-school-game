export interface Png {
  w: number;
  h: number;
  data: Buffer;
}
export function decodePng(file: string): Png;
export function alphaAt(img: Png, x: number, y: number): number;
