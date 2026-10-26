// A single sine wave component.

/** Sine wave defined by amplitude, angular velocity, and phase. */
export class Sinusoid {
  /**
   * @param amplitude - Peak value of the wave.
   * @param velocityAngular - Angular velocity in radians per unit of x.
   * @param phase - Phase shift in radians.
   */
  constructor(
    readonly amplitude: number,
    readonly velocityAngular: number,
    readonly phase: number,
  ) {}

  /** Evaluates the wave at x. */
  evaluate(x: number): number {
    return this.amplitude * Math.sin(this.velocityAngular * x + this.phase)
  }
}
