//


export function matchString(string: string, pattern: StringPattern): boolean {
  if (typeof pattern === "function") {
    return pattern(string);
  } else if (pattern instanceof RegExp) {
    return string.match(pattern) !== null;
  } else if (typeof pattern === "boolean") {
    return pattern;
  } else {
    return string === pattern;
  }
}

export type StringPattern = string | boolean | RegExp | ((string: string) => boolean);