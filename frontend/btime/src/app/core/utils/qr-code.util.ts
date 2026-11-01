/**
 * Generatore QR Code SVG conforme a ISO/IEC 18004 (Byte Mode, ECC Level L, Versioni 1-10).
 * Funziona 100% offline su rete locale / VPN Tailscale senza dipendenze esterne.
 */

interface VersionSpec {
  version: number;
  totalData: number;
  ecPerBlock: number;
  numBlocks1: number;
  dataPerBlock1: number;
  numBlocks2: number;
  dataPerBlock2: number;
  align: number[];
}

const VERSION_SPECS_L: VersionSpec[] = [
  { version: 1, totalData: 19, ecPerBlock: 7, numBlocks1: 1, dataPerBlock1: 19, numBlocks2: 0, dataPerBlock2: 0, align: [] },
  { version: 2, totalData: 34, ecPerBlock: 10, numBlocks1: 1, dataPerBlock1: 34, numBlocks2: 0, dataPerBlock2: 0, align: [6, 18] },
  { version: 3, totalData: 55, ecPerBlock: 15, numBlocks1: 1, dataPerBlock1: 55, numBlocks2: 0, dataPerBlock2: 0, align: [6, 22] },
  { version: 4, totalData: 80, ecPerBlock: 20, numBlocks1: 1, dataPerBlock1: 80, numBlocks2: 0, dataPerBlock2: 0, align: [6, 26] },
  { version: 5, totalData: 108, ecPerBlock: 26, numBlocks1: 1, dataPerBlock1: 108, numBlocks2: 0, dataPerBlock2: 0, align: [6, 30] },
  { version: 6, totalData: 136, ecPerBlock: 18, numBlocks1: 2, dataPerBlock1: 68, numBlocks2: 0, dataPerBlock2: 0, align: [6, 34] },
  { version: 7, totalData: 156, ecPerBlock: 20, numBlocks1: 2, dataPerBlock1: 78, numBlocks2: 0, dataPerBlock2: 0, align: [6, 22, 38] },
  { version: 8, totalData: 194, ecPerBlock: 24, numBlocks1: 2, dataPerBlock1: 97, numBlocks2: 0, dataPerBlock2: 0, align: [6, 24, 42] },
  { version: 9, totalData: 232, ecPerBlock: 30, numBlocks1: 2, dataPerBlock1: 116, numBlocks2: 0, dataPerBlock2: 0, align: [6, 26, 46] },
  { version: 10, totalData: 274, ecPerBlock: 18, numBlocks1: 2, dataPerBlock1: 68, numBlocks2: 2, dataPerBlock2: 69, align: [6, 28, 50] },
];

// Aritmetica GF(256) con polinomio primitivo 0x11D
function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >> 7) * 0x11d);
    z ^= ((y >> i) & 1) * x;
  }
  return z;
}

function rsComputeDivisor(degree: number): Uint8Array {
  const result = new Uint8Array(degree);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < degree) {
        result[j] ^= result[j + 1];
      }
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

function rsComputeRemainder(data: Uint8Array, divisor: Uint8Array): Uint8Array {
  const result = new Uint8Array(divisor.length);
  for (const b of data) {
    const factor = b ^ result[0];
    result.copyWithin(0, 1);
    result[divisor.length - 1] = 0;
    for (let i = 0; i < divisor.length; i++) {
      result[i] ^= gfMul(divisor[i], factor);
    }
  }
  return result;
}

function appendBits(val: number, len: number, bits: number[]): void {
  for (let i = len - 1; i >= 0; i--) {
    bits.push((val >>> i) & 1);
  }
}

export function generateQrMatrix(text: string): boolean[][] {
  const payload = new TextEncoder().encode(text);

  let spec: VersionSpec | undefined;
  for (const s of VERSION_SPECS_L) {
    const countBits = s.version <= 9 ? 8 : 16;
    const neededBits = 4 + countBits + payload.length * 8;
    if (neededBits <= s.totalData * 8) {
      spec = s;
      break;
    }
  }
  if (!spec) {
    throw new Error("Testo troppo lungo per la generazione del QR Code.");
  }

  // 1. Codifica Byte Mode (0100) + padding
  const bits: number[] = [];
  appendBits(0b0100, 4, bits);
  appendBits(payload.length, spec.version <= 9 ? 8 : 16, bits);
  for (const b of payload) {
    appendBits(b, 8, bits);
  }

  const capacityBits = spec.totalData * 8;
  appendBits(0, Math.min(4, capacityBits - bits.length), bits);
  appendBits(0, (8 - (bits.length % 8)) % 8, bits);

  for (let padByte = 0xec; bits.length < capacityBits; padByte ^= 0xec ^ 0x11) {
    appendBits(padByte, 8, bits);
  }

  const dataCodewords = new Uint8Array(spec.totalData);
  for (let i = 0; i < bits.length; i++) {
    dataCodewords[i >>> 3] |= bits[i] << (7 - (i & 7));
  }

  // 2. Suddivisione in blocchi Reed-Solomon e interleaving
  const rsDiv = rsComputeDivisor(spec.ecPerBlock);
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;

  for (let i = 0; i < spec.numBlocks1; i++) {
    const blk = dataCodewords.slice(offset, offset + spec.dataPerBlock1);
    offset += spec.dataPerBlock1;
    dataBlocks.push(blk);
    ecBlocks.push(rsComputeRemainder(blk, rsDiv));
  }
  for (let i = 0; i < spec.numBlocks2; i++) {
    const blk = dataCodewords.slice(offset, offset + spec.dataPerBlock2);
    offset += spec.dataPerBlock2;
    dataBlocks.push(blk);
    ecBlocks.push(rsComputeRemainder(blk, rsDiv));
  }

  const interleaved: number[] = [];
  const maxDataLen = Math.max(spec.dataPerBlock1, spec.dataPerBlock2);
  for (let i = 0; i < maxDataLen; i++) {
    for (const blk of dataBlocks) {
      if (i < blk.length) interleaved.push(blk[i]);
    }
  }
  for (let i = 0; i < spec.ecPerBlock; i++) {
    for (const blk of ecBlocks) {
      interleaved.push(blk[i]);
    }
  }

  // 3. Costruzione matrice e pattern funzionali
  const size = spec.version * 4 + 17;
  const modules: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  const isFunc: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  const setFunc = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark;
      isFunc[r][c] = true;
    }
  };

  // Timing patterns
  for (let i = 0; i < size; i++) {
    setFunc(6, i, i % 2 === 0);
    setFunc(i, 6, i % 2 === 0);
  }

  // Finder patterns + separatori (3 angoli)
  const drawFinder = (centerR: number, centerC: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        setFunc(centerR + dy, centerC + dx, dist !== 2 && dist !== 4);
      }
    }
  };
  drawFinder(3, 3);
  drawFinder(3, size - 4);
  drawFinder(size - 4, 3);

  // Alignment patterns
  const align = spec.align;
  for (let i = 0; i < align.length; i++) {
    for (let j = 0; j < align.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === align.length - 1) || (i === align.length - 1 && j === 0)) {
        continue;
      }
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          setFunc(align[i] + dy, align[j] + dx, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
  }

  // Riserva area Format Info + Dark Module
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) {
      setFunc(i, 8, false);
      setFunc(8, i, false);
    }
  }
  for (let i = 0; i < 8; i++) {
    setFunc(8, size - 1 - i, false);
    if (i < 7) setFunc(size - 1 - i, 8, false);
  }
  setFunc(size - 8, 8, true); // Dark module fisso

  // Version Info (solo per version >= 7)
  if (spec.version >= 7) {
    let rem = spec.version;
    for (let i = 0; i < 12; i++) {
      rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    }
    const verBits = (spec.version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const bit = ((verBits >>> i) & 1) !== 0;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      setFunc(b, a, bit);
      setFunc(a, b, bit);
    }
  }

  // 4. Scrittura dati a zig-zag
  let bitIdx = 0;
  const totalBits = interleaved.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    const upward = ((right + 1) & 2) === 0;
    for (let vert = 0; vert < size; vert++) {
      const r = upward ? size - 1 - vert : vert;
      for (let j = 0; j < 2; j++) {
        const c = right - j;
        if (!isFunc[r][c]) {
          let dark = false;
          if (bitIdx < totalBits) {
            dark = ((interleaved[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1) !== 0;
            bitIdx++;
          }
          modules[r][c] = dark;
        }
      }
    }
  }

  // 5. Selezione maschera ottimale (0..7) e scrittura Format Info
  const drawFormatBits = (grid: boolean[][], mask: number) => {
    const data = (0b01 << 3) | mask; // 01 = ECC Level L
    let rem = data;
    for (let i = 0; i < 10; i++) {
      rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    }
    const bits15 = ((data << 10) | rem) ^ 0x5412;

    for (let i = 0; i <= 5; i++) grid[i][8] = ((bits15 >>> i) & 1) !== 0;
    grid[7][8] = ((bits15 >>> 6) & 1) !== 0;
    grid[8][8] = ((bits15 >>> 7) & 1) !== 0;
    grid[8][7] = ((bits15 >>> 8) & 1) !== 0;
    for (let i = 9; i < 15; i++) grid[8][14 - i] = ((bits15 >>> i) & 1) !== 0;

    for (let i = 0; i < 8; i++) grid[8][size - 1 - i] = ((bits15 >>> i) & 1) !== 0;
    for (let i = 8; i < 15; i++) grid[size - 15 + i][8] = ((bits15 >>> i) & 1) !== 0;
    grid[size - 8][8] = true;
  };

  const maskBit = (mask: number, r: number, c: number): boolean => {
    switch (mask) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
      case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      default: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    }
  };

  const computePenalty = (grid: boolean[][]): number => {
    let penalty = 0;
    // Regola 1: sequenze consecutive >= 5
    for (let r = 0; r < size; r++) {
      let runR = 1;
      let runC = 1;
      for (let c = 1; c < size; c++) {
        if (grid[r][c] === grid[r][c - 1]) {
          runR++;
          if (runR === 5) penalty += 3;
          else if (runR > 5) penalty += 1;
        } else runR = 1;

        if (grid[c][r] === grid[c - 1][r]) {
          runC++;
          if (runC === 5) penalty += 3;
          else if (runC > 5) penalty += 1;
        } else runC = 1;
      }
    }
    // Regola 2: blocchi 2x2
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size - 1; c++) {
        const v = grid[r][c];
        if (v === grid[r][c + 1] && v === grid[r + 1][c] && v === grid[r + 1][c + 1]) {
          penalty += 3;
        }
      }
    }
    return penalty;
  };

  let bestGrid = modules;
  let bestScore = Infinity;

  for (let mask = 0; mask < 8; mask++) {
    const candidate = modules.map((row, r) =>
      row.map((val, c) => (isFunc[r][c] ? val : val !== maskBit(mask, r, c)))
    );
    drawFormatBits(candidate, mask);
    const score = computePenalty(candidate);
    if (score < bestScore) {
      bestScore = score;
      bestGrid = candidate;
    }
  }

  return bestGrid;
}

export interface QrSvgData {
  viewBox: string;
  path: string;
  size: number;
}

/**
 * Genera i dati vettoriali SVG (viewBox e path) per il rendering inline diretto nel template Angular.
 */
export function generateQrSvgData(text: string, border = 3): QrSvgData {
  const matrix = generateQrMatrix(text);
  const size = matrix.length;
  const viewSize = size + border * 2;

  const parts: string[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        parts.push(`M${c + border},${r + border}h1v1h-1z`);
      }
    }
  }

  return {
    viewBox: `0 0 ${viewSize} ${viewSize}`,
    path: parts.join(""),
    size: viewSize,
  };
}

/**
 * Genera un Data URI SVG nitido del QR Code pronto per l'attributo [src] di un tag <img>.
 */
export function generateQrSvgDataUrl(text: string, border = 3): string {
  const { viewBox, path } = generateQrSvgData(text, border);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" shape-rendering="crispEdges">` +
    `<rect width="100%" height="100%" fill="#FFFFFF"/>` +
    `<path d="${path}" fill="#09090B"/>` +
    `</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
