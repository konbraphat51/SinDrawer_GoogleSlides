// Generates the extension icons (Public/Icons/Icon{16,32,48,128}.png) without external dependencies.
import { deflateSync } from "node:zlib"
import { mkdirSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const SIZES = [16, 32, 48, 128]
const SUPERSAMPLING = 4
const COLOR_WAVE = [0x58, 0xe0, 0x8e]
const COLOR_BACKGROUND = [0xff, 0xff, 0xff]
const COLOR_BORDER = [0x2f, 0x9e, 0x5c]
const directoryOutput = fileURLToPath(new URL("../Public/Icons/", import.meta.url))

// returns [r, g, b, a] for a point in unit coordinates
function shadePoint(x, y) {
  const radius = 0.22
  const dx = Math.max(radius - x, 0, x - (1 - radius))
  const dy = Math.max(radius - y, 0, y - (1 - radius))
  const distanceCorner = Math.hypot(dx, dy)
  if (distanceCorner > radius) {
    return [0, 0, 0, 0]
  }
  if (distanceCorner > radius - 0.06 && (dx > 0 || dy > 0)) {
    return [...COLOR_BORDER, 255]
  }
  if (x < 0.06 || x > 0.94 || y < 0.06 || y > 0.94) {
    return [...COLOR_BORDER, 255]
  }

  const yWave = 0.55 + 0.12 * Math.sin(2 * Math.PI * 1.7 * x + 0.3) + 0.03 * Math.sin(17 * x)
  return y > yWave ? [...COLOR_WAVE, 255] : [...COLOR_BACKGROUND, 255]
}

function renderPixels(size) {
  const pixels = Buffer.alloc(size * size * 4)
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const sum = [0, 0, 0, 0]
      for (let sy = 0; sy < SUPERSAMPLING; sy++) {
        for (let sx = 0; sx < SUPERSAMPLING; sx++) {
          const color = shadePoint(
            (px + (sx + 0.5) / SUPERSAMPLING) / size,
            (py + (sy + 0.5) / SUPERSAMPLING) / size,
          )
          // premultiply so transparent samples do not darken edges
          sum[0] += color[0] * color[3]
          sum[1] += color[1] * color[3]
          sum[2] += color[2] * color[3]
          sum[3] += color[3]
        }
      }
      const offset = (py * size + px) * 4
      const alpha = sum[3] / SUPERSAMPLING ** 2
      for (let c = 0; c < 3; c++) {
        pixels[offset + c] = sum[3] === 0 ? 0 : Math.round(sum[c] / sum[3])
      }
      pixels[offset + 3] = Math.round(alpha)
    }
  }
  return pixels
}

function computeCrc32(buffer) {
  let crc = ~0
  for (const byte of buffer) {
    crc ^= byte
    for (let k = 0; k < 8; k++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return ~crc >>> 0
}

function buildChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, "ascii"), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(computeCrc32(body))
  return Buffer.concat([length, body, crc])
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8 // bit depth
  header[9] = 6 // RGBA
  const rows = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    pixels.copy(rows, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    buildChunk("IHDR", header),
    buildChunk("IDAT", deflateSync(rows)),
    buildChunk("IEND", Buffer.alloc(0)),
  ])
}

mkdirSync(directoryOutput, { recursive: true })
for (const size of SIZES) {
  writeFileSync(`${directoryOutput}Icon${size}.png`, encodePng(size, renderPixels(size)))
  console.log(`Generated Icon${size}.png`)
}
