// Verifies the ported shape builder reproduces the original SinDrawer output exactly.
import { describe, expect, it } from "vitest"
import { buildShape, projectPlotsAlongVector, scalePlotsToAmplitude } from "../../Src/Core/Curve"
import { PLACEMENTS, PRESETS_PLACEMENT } from "../../Src/Core/Placement"
import { convertTextToSeed } from "../../Src/Core/Seed"
import { drawOriginal } from "./OriginalSinDrawer"

const TITLES = ["", "Introduction", "研究背景", "Results & Discussion"]
const SIZES = [
  { width: 1280, height: 780 },
  { width: 1280, height: 720 },
  { width: 640, height: 480 },
]

describe("buildShape", () => {
  for (const placement of PLACEMENTS) {
    for (const title of TITLES) {
      for (const size of SIZES) {
        it(`matches the original for ${placement} / "${title}" / ${size.width}x${size.height}`, () => {
          const seed = convertTextToSeed(title)
          const rateAxis = PRESETS_PLACEMENT[placement].rateAxisDefault
          const expected = drawOriginal(seed, placement, size.width, size.height, rateAxis, 20)

          const actual = buildShape({ placement, rateAxis, amplitudeMax: 20, seed, size })

          expect(actual.isFilled).toBe(expected.isFilled)
          expect(actual.points.map((point) => [...point])).toEqual(expected.points)
        })
      }
    }
  }

  it("changes with the seed", () => {
    const request = {
      placement: "top" as const,
      rateAxis: 0.1,
      amplitudeMax: 20,
      size: { width: 1280, height: 720 },
    }
    const shapeA = buildShape({ ...request, seed: convertTextToSeed("A") })
    const shapeB = buildShape({ ...request, seed: convertTextToSeed("B") })
    expect(shapeA.points).not.toEqual(shapeB.points)
  })
})

describe("scalePlotsToAmplitude", () => {
  it("scales the peak to the requested amplitude", () => {
    expect(scalePlotsToAmplitude([1, -4, 2], 8)).toEqual([2, -8, 4])
  })

  it("leaves all-zero plots untouched", () => {
    expect(scalePlotsToAmplitude([0, 0], 8)).toEqual([0, 0])
  })
})

describe("projectPlotsAlongVector", () => {
  it("stops when the baseline leaves the canvas", () => {
    const points = projectPlotsAlongVector([0, 0, 0, 0, 0], [0, 0], [1, 0], {
      width: 2,
      height: 2,
    })
    expect(points).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
    ])
  })

  it("offsets perpendicular to the direction", () => {
    const points = projectPlotsAlongVector([5], [10, 10], [1, 0], { width: 20, height: 20 })
    expect(points).toEqual([[10, 15]])
  })
})
