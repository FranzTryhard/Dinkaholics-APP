import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

function crc32(buf) {
  let table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function createPNG(width, height, isMaskable = false) {
  // RGBA buffer for raw pixels
  // Each scanline has 1 filter byte (0) + width * 4 bytes
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const maxR = width * (isMaskable ? 0.38 : 0.44);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep green court gradient
      const tY = y / height;
      let r = Math.round(15 * (1 - tY) + 8 * tY);
      let g = Math.round(57 * (1 - tY) + 34 * tY);
      let b = Math.round(43 * (1 - tY) + 25 * tY);
      let a = 255;

      // Ball / paddle icon center graphic
      if (dist <= maxR) {
        // Paddle face angled or ball
        const ballDist = Math.sqrt((x - (cx + width * 0.12)) ** 2 + (y - (cy - height * 0.1)) ** 2);
        const ballRadius = width * 0.16;

        if (ballDist < ballRadius) {
          // Yellow-green neon pickleball
          r = 212;
          g = 233;
          b = 56;
          // holes inside ball
          const hole1 = Math.sqrt((x - (cx + width * 0.12)) ** 2 + (y - (cy - height * 0.1)) ** 2);
          const hole2 = Math.sqrt((x - (cx + width * 0.07)) ** 2 + (y - (cy - height * 0.13)) ** 2);
          const hole3 = Math.sqrt((x - (cx + width * 0.17)) ** 2 + (y - (cy - height * 0.07)) ** 2);
          const hole4 = Math.sqrt((x - (cx + width * 0.15)) ** 2 + (y - (cy - height * 0.15)) ** 2);
          const hole5 = Math.sqrt((x - (cx + width * 0.08)) ** 2 + (y - (cy - height * 0.05)) ** 2);
          const hr = width * 0.024;
          if (hole1 < hr || hole2 < hr || hole3 < hr || hole4 < hr || hole5 < hr) {
            r = 22; g = 56; b = 40;
          }
        } else {
          // Paddle body
          const paddleDist = Math.sqrt((x - (cx - width * 0.08)) ** 2 + (y - (cy + height * 0.05)) ** 2);
          if (paddleDist < width * 0.22) {
            r = 30; g = 107; b = 82;
            if (paddleDist > width * 0.20) {
              r = 226; g = 249; b = 82; // rim
            }
          }
        }
      }

      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
      rawData[px + 3] = a;
    }
  }

  // PNG header
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth 8
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT chunk
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const toCrc = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPNG(192, 192, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPNG(512, 512, false));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, true));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPNG(180, 180, false));
console.log('Successfully generated PWA and Apple Touch icons.');
