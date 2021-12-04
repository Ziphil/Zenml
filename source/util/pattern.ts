//


export function matchString(string: string, pattern: StringPattern): boolean {
  if (typeof pattern === "string") {
    return string === pattern;
  } else if (typeof pattern === "boolean") {
    return pattern;
  } else if (pattern instanceof RegExp) {
    return string.match(pattern) !== null;
  } else if (typeof pattern === "function") {
    return pattern(string);
  } else {
    return pattern.every((eachPattern) => matchString(string, eachPattern));
  }
}

export type StringPattern = string | boolean | RegExp | ((string: string) => boolean) | Array<StringPattern>;