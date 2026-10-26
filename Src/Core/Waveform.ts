// Sum of randomly generated sine waves, the core shape of SinDrawer.
import { Sinusoid } from "./Sinusoid"
import { XorShift } from "./XorShift"

/** Ranges used to draw random sine wave parameters. Each value is drawn from [min, min + width). */
export interface ParametersWaveform {
  /** Number of sine waves to sum. */
  count: number
  amplitudeWidth: number
  amplitudeMin: number
  velocityAngularWidth: number
  velocityAngularMin: number
  /** Upper bound of the random phase shift, in radians. */
  phaseShiftMax: number
}

/** Superposition of sine waves. */
export class Waveform {
  /**
   * @param sinusoids - Components to sum.
   */
  constructor(readonly sinusoids: readonly Sinusoid[]) {}

  /**
   * Creates a waveform with parameters drawn from a seeded generator, exactly like the original MakeSinsRandomly().
   *
   * @param seed - Seed for the random generator.
   * @param parameters - Ranges of the random parameters.
   */
  static createRandomly(seed: number, parameters: ParametersWaveform): Waveform {
    const random = new XorShift(seed)
    const sinusoids: Sinusoid[] = []
    for (let i = 0; i < parameters.count; i++) {
      // argument evaluation order matters for reproducibility: amplitude, velocity, phase
      const amplitude = random.nextFloat() * parameters.amplitudeWidth + parameters.amplitudeMin
      const velocityAngular =
        random.nextFloat() * parameters.velocityAngularWidth + parameters.velocityAngularMin
      const phase = random.nextFloat() * parameters.phaseShiftMax
      sinusoids.push(new Sinusoid(amplitude, velocityAngular, phase))
    }
    return new Waveform(sinusoids)
  }

  /** Evaluates the sum of all components at x. */
  evaluate(x: number): number {
    let value = 0
    for (const sinusoid of this.sinusoids) {
      value += sinusoid.evaluate(x)
    }
    return value
  }

  /**
   * Samples the waveform at x = 0, 1, ..., count - 1.
   *
   * @param count - Number of samples.
   */
  sample(count: number): number[] {
    const plots: number[] = []
    for (let i = 0; i < count; i++) {
      plots.push(this.evaluate(i))
    }
    return plots
  }
}
