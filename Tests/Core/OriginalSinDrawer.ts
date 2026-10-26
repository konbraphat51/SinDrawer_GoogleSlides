// Near-verbatim copy of the original SinDrawer main.js math, used as a test oracle for the port.
/* eslint-disable */

class Sin {
  constructor(
    public amplitude: number,
    public angularVelocity: number,
    public phase: number,
  ) {}
  Calc(x: number) {
    return this.amplitude * Math.sin(this.angularVelocity * x + this.phase)
  }
}

class Random {
  x = 123456789
  y = 362436069
  z = 521288629
  w: number
  constructor(seed = 88675123) {
    this.w = seed
  }
  next() {
    let t
    t = this.x ^ (this.x << 11)
    this.x = this.y
    this.y = this.z
    this.z = this.w
    return (this.w = this.w ^ (this.w >>> 19) ^ (t ^ (t >>> 8)))
  }
  nextFloat() {
    const absolute = Math.abs(this.next())
    const r = absolute % 1000
    return r / 1000
  }
}

function Func(x: number, sins: Sin[]) {
  let value = 0
  for (let i = 0; i < sins.length; i++) value += sins[i]!.Calc(x)
  return value
}

function MakeSinsRandomly(
  textSeed: number,
  amount: number,
  aw: number,
  am: number,
  vw: number,
  vm: number,
  pm: number,
) {
  const sins = []
  const random = new Random(textSeed)
  for (let i = 0; i < amount; i++) {
    sins.push(
      new Sin(random.nextFloat() * aw + am, random.nextFloat() * vw + vm, random.nextFloat() * pm),
    )
  }
  return sins
}

function ScalePlots(plots: number[], max: number) {
  let maxAbs = 0
  for (const p of plots) maxAbs = Math.max(maxAbs, Math.abs(p))
  if (maxAbs === 0) return plots
  const scale = max / maxAbs
  return plots.map((p) => p * scale)
}

function PlotFlat(
  seed: number,
  sinN: number,
  plotN: number,
  aw: number,
  am: number,
  vw: number,
  vm: number,
  pm: number,
  max: number,
) {
  const sins = MakeSinsRandomly(seed, sinN, aw, am, vw, vm, pm)
  const plotted = []
  for (let i = 0; i < plotN; i++) plotted.push(Func(i, sins))
  return ScalePlots(plotted, max)
}

function PlotByVector(
  start: number[],
  direction: number[],
  plots: number[],
  RIGHT: number,
  BOTTOM: number,
) {
  const n = (direction[0]! ** 2 + direction[1]! ** 2) ** 0.5
  const dx = direction[0]! / n
  const dy = direction[1]! / n
  const px = -dy
  const py = dx
  let xBase = start[0]!
  let yBase = start[1]!
  const plotted: number[][] = []
  let cnt = 0
  while (0 <= xBase && xBase <= RIGHT && 0 <= yBase && yBase <= BOTTOM && cnt < plots.length) {
    plotted.push([plots[cnt]! * px + xBase, plots[cnt]! * py + yBase])
    xBase += dx
    yBase += dy
    cnt++
  }
  return plotted
}

/** Returns the vertex list the original Draw() would draw for the given inputs. */
export function drawOriginal(
  seed: number,
  position: string,
  RIGHT: number,
  DOWN: number,
  axisPositionRate: number,
  maxAmplitude: number,
): { points: number[][]; isFilled: boolean } {
  const UP = 0
  const LEFT = 0
  const plotN = Math.ceil((RIGHT ** 2 + DOWN ** 2) ** 0.5) + 16
  let plots: number[] = []
  let start: number[] = []
  let direction: number[] = []
  let lastAdding: number[][] = []
  let polygonAtLast = false
  if (position == "rightFill") {
    plots = PlotFlat(seed, 3, plotN, 4, 10, 0.5, 0.3, 2 * Math.PI, maxAmplitude)
    start = [RIGHT * axisPositionRate, UP]
    direction = [0, 1]
    lastAdding = [
      [RIGHT, DOWN],
      [RIGHT, UP],
    ]
    polygonAtLast = true
  } else if (position == "rightTopFill") {
    plots = PlotFlat(seed, 3, plotN, 10, 10, 0.1, 0.6, 0, maxAmplitude)
    start = [RIGHT * axisPositionRate, UP]
    direction = [2 ** -0.5, 2 ** -0.5]
    lastAdding = [[RIGHT, UP]]
    polygonAtLast = true
  } else if (position == "top") {
    plots = PlotFlat(seed, 4, plotN, 6, 2, 0.5, 0.6, 6, maxAmplitude)
    start = [LEFT, DOWN * axisPositionRate]
    direction = [1, 0]
  } else if (position == "topFill") {
    plots = PlotFlat(seed, 2, plotN, 10, 5, 0.3, 0.1, 0, maxAmplitude)
    start = [LEFT, DOWN * axisPositionRate]
    direction = [1, 0]
    lastAdding = [
      [RIGHT, UP],
      [LEFT, UP],
    ]
    polygonAtLast = true
  }
  const curve = PlotByVector(start, direction, plots, RIGHT, DOWN)
  if (polygonAtLast) curve.push(...lastAdding)
  return { points: curve, isFilled: polygonAtLast }
}
