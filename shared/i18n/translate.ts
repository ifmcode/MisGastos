/** A translated-key function safe for dynamic keys such as error codes. */
export type Translate = (
  key: string,
  options?: Record<string, unknown>,
) => string;

/**
 * Adapts a namespace-scoped i18next `t` to the dynamic-key `Translate`
 * contract. Static keys stay checked by the typed `t`; dynamic keys (error
 * codes, option keys) go through this adapter.
 */
export function asTranslate(t: unknown): Translate {
  const translate = t as Translate;
  return (key, options) => translate(key, options);
}
