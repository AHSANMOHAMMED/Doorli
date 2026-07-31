/** Coerce Express `string | string[]` params/queries to a single string. */
export function asSingle(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

/** Require a single path/query param or throw. */
export function requireParam(
  v: string | string[] | undefined,
  name: string,
): string {
  const value = asSingle(v);
  if (!value) throw new Error(`${name} is required`);
  return value;
}
