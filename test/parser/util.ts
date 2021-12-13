//

import {
  DOMImplementation,
  XMLSerializer
} from "@xmldom/xmldom";
import {
  ZenmlParser,
  ZenmlParserOptions,
  ZenmlPlugin
} from "../../source";


let implementation = new DOMImplementation();
let serializer = new XMLSerializer();

function createParser(options?: ZenmlParserOptions, callback?: (parser: ZenmlParser) => unknown): ZenmlParser {
  let parser = new ZenmlParser(implementation, options);
  if (callback !== undefined) {
    callback(parser);
  }
  return parser;
}

export function shouldEquivalent(input: string, output: string, options?: ZenmlParserOptions, callback?: (parser: ZenmlParser) => unknown): void {
  let parser = createParser(options, callback);
  expect(serializer.serializeToString(parser.tryParse(input))).toBe(output);
}

export function shouldFail(input: string, options?: ZenmlParserOptions, callback?: (parser: ZenmlParser) => unknown): void {
  let parser = createParser(options, callback);
  expect(() => parser.tryParse(input)).toThrow();
}