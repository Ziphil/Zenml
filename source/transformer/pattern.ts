//


export function matchString(string: string, pattern: StringPattern): boolean {
  if (typeof pattern === "function") {
    return pattern(string);
  } else if (pattern instanceof RegExp) {
    return string.match(pattern) !== null;
  } else {
    return string === pattern;
  }
}

export type StringPattern = string | RegExp | ((string: string) => boolean);