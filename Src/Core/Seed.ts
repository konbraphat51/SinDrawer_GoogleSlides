// Converts text (typically a slide title) into a random seed.

/**
 * Sums the UTF-16 code units of the text, as the original SinDrawer does.
 *
 * @param text - Source text; an empty string yields 0.
 */
export function convertTextToSeed(text: string): number {
  let seed = 0
  for (let i = 0; i < text.length; i++) {
    seed += text.charCodeAt(i)
  }
  return seed
}
