// User-adjustable drawing settings, their defaults, and sanitization of untrusted input.
import { clamp } from "./Geometry"
import { isPlacement, PLACEMENTS, PRESETS_PLACEMENT, type Placement } from "./Placement"

/** Everything the user can tweak about the drawing. */
export interface Settings {
  /** Wave color as #rrggbb. */
  colorWave: string
  placement: Placement
  /** Axis position rate remembered separately for each placement. */
  rateAxisByPlacement: Record<Placement, number>
  /** Peak offset of the curve, in logical pixels (canvas width 1280). */
  amplitudeMax: number
  /** Background color as #rrggbb, used unless the background is transparent. */
  colorBackground: string
  isBackgroundTransparent: boolean
  /** Width of the generated image in pixels; height follows the slide aspect ratio. */
  widthOutput: number
}

export const WIDTH_OUTPUT_MIN = 64
export const WIDTH_OUTPUT_MAX = 4096
export const AMPLITUDE_MAX_MIN = 1

/** Defaults matching the original SinDrawer page. */
export const SETTINGS_DEFAULT: Readonly<Settings> = {
  colorWave: "#58e08e",
  placement: "top",
  rateAxisByPlacement: createRatesAxisDefault(),
  amplitudeMax: 20,
  colorBackground: "#ffffff",
  isBackgroundTransparent: false,
  widthOutput: 1920,
}

const PATTERN_COLOR = /^#[0-9a-fA-F]{6}$/

/**
 * Builds valid settings from partial or untrusted data, falling back to defaults field by field.
 *
 * @param source - Data such as values read back from storage.
 */
export function normalizeSettings(source: unknown): Settings {
  const record = (typeof source === "object" && source !== null ? source : {}) as Record<
    string,
    unknown
  >

  return {
    colorWave: normalizeColor(record.colorWave, SETTINGS_DEFAULT.colorWave),
    placement: isPlacement(record.placement) ? record.placement : SETTINGS_DEFAULT.placement,
    rateAxisByPlacement: normalizeRatesAxis(record.rateAxisByPlacement),
    amplitudeMax: Math.max(
      AMPLITUDE_MAX_MIN,
      convertToFiniteNumber(record.amplitudeMax, SETTINGS_DEFAULT.amplitudeMax),
    ),
    colorBackground: normalizeColor(record.colorBackground, SETTINGS_DEFAULT.colorBackground),
    isBackgroundTransparent: record.isBackgroundTransparent === true,
    widthOutput: Math.round(
      clamp(
        convertToFiniteNumber(record.widthOutput, SETTINGS_DEFAULT.widthOutput),
        WIDTH_OUTPUT_MIN,
        WIDTH_OUTPUT_MAX,
      ),
    ),
  }
}

/**
 * Parses a number, returning the fallback for anything non-finite.
 *
 * @param value - Value to parse.
 * @param fallback - Returned when parsing fails.
 */
export function convertToFiniteNumber(value: unknown, fallback: number): number {
  if (value === null || value === "" || typeof value === "boolean") {
    return fallback
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function createRatesAxisDefault(): Record<Placement, number> {
  const rates = {} as Record<Placement, number>
  for (const placement of PLACEMENTS) {
    rates[placement] = PRESETS_PLACEMENT[placement].rateAxisDefault
  }
  return rates
}

function normalizeRatesAxis(source: unknown): Record<Placement, number> {
  const record = (typeof source === "object" && source !== null ? source : {}) as Record<
    string,
    unknown
  >
  const rates = createRatesAxisDefault()
  for (const placement of PLACEMENTS) {
    rates[placement] = clamp(convertToFiniteNumber(record[placement], rates[placement]), 0, 1)
  }
  return rates
}

function normalizeColor(value: unknown, fallback: string): string {
  return typeof value === "string" && PATTERN_COLOR.test(value) ? value.toLowerCase() : fallback
}
