// Shares the active translator with every popup component through Vue's provide/inject.
import { inject, type InjectionKey, type Ref } from "vue"
import type { KeyMessage, Translator } from "./Translator"

/** Injection key for the reactive translator provided by the root component. */
export const KEY_TRANSLATOR: InjectionKey<Ref<Translator>> = Symbol("translator")

/** Translation function bound to the current language. */
export type FunctionTranslate = (key: KeyMessage, substitutions?: readonly string[]) => string

/** Returns a translate function that re-renders the caller when the language changes. */
export function useTranslate(): FunctionTranslate {
  const translator = inject(KEY_TRANSLATOR)
  if (translator === undefined) {
    throw new Error("Translator is not provided.")
  }
  return (key, substitutions) => translator.value.translate(key, substitutions)
}
