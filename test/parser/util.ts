//

import {
  DOMImplementation,
  XMLSerializer
} from "@xmldom/xmldom";
import {
  ZenmlParser,
  ZenmlParserOptions
} from "../../source";


const implementation = new DOMImplementation();
const serializer = new XMLSerializer();

function createParser(options?: ZenmlParserOptions, callback?: (parser: ZenmlParser) => unknown): ZenmlParser {
  const parser = new ZenmlParser(implementation, options);
  if (callback !== undefined) {
    callback(parser);
  }
  return parser;
}

export function shouldEquivalent(input: string, output: string, options?: ZenmlParserOptions, callback?: (parser: ZenmlParser) => unknown): void {
  const parser = createParser(options, callback);
  expect(serializer.serializeToString(parser.parse(input))).toBe(output);
}

export function shouldFail(input: string, options?: ZenmlParserOptions, callback?: (parser: ZenmlParser) => unknown): void {
  const parser = createParser(options, callback);
  expect(() => parser.parse(input)).toThrow();
}