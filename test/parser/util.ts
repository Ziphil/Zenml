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

function createParser(options?: ZenmlParserOptions, plugins?: Array<[string, ZenmlPlugin]>): ZenmlParser {
  let parser = new ZenmlParser(implementation, options);
  if (plugins !== undefined) {
    for (let [name, plugin] of plugins) {
      parser.registerPlugin(name, plugin);
    }
  }
  return parser;
}

export function shouldEquivalent(input: string, output: string, options?: ZenmlParserOptions, plugins?: Array<[string, ZenmlPlugin]>): void {
  let parser = createParser(options, plugins);
  expect(serializer.serializeToString(parser.tryParse(input))).toBe(output);
}

export function shouldFail(input: string, options?: ZenmlParserOptions, plugins?: Array<[string, ZenmlPlugin]>): void {
  let parser = createParser(options, plugins);
  expect(() => parser.tryParse(input)).toThrow();
}