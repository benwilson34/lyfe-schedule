export function parseBoolean(boolString: string | null): boolean | null {
  if (boolString === null || !/^(true|false)$/i.test(boolString)) {
    // TODO print some "invalid configuration" error message?
    return null;
  }
  return boolString.toLowerCase() === "true";
}
