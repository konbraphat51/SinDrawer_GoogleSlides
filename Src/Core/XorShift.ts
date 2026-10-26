// Reproducible pseudo random number generator, ported as-is from the original SinDrawer.

/**
 * XorShift128 generator that yields the same sequence for the same seed.
 * Based on https://sbfl.net/blog/2017/06/01/javascript-reproducible-random/
 */
export class XorShift {
  private x = 123456789
  private y = 362436069
  private z = 521288629
  private w: number

  /**
   * @param seed - Integer seed; the original SinDrawer default is 88675123.
   */
  constructor(seed = 88675123) {
    this.w = seed
  }

  /** Advances the generator and returns a signed 32-bit integer. */
  next(): number {
    const t = this.x ^ (this.x << 11)
    this.x = this.y
    this.y = this.z
    this.z = this.w
    this.w = this.w ^ (this.w >>> 19) ^ (t ^ (t >>> 8))
    return this.w
  }

  /** Returns a float in [0, 1) with a resolution of 1/1000, matching the original. */
  nextFloat(): number {
    return (Math.abs(this.next()) % 1000) / 1000
  }
}
