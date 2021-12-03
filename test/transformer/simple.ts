//

import {
  DOMParser
} from "@xmldom/xmldom";
import $ from "ts-dedent";
import {
  SimpleDocument,
  Transformer
} from "../../source";


function createTransformer(callback?: (transformer: Transformer<SimpleDocument>) => unknown): Transformer<SimpleDocument> {
  let transformer = new Transformer(() => new SimpleDocument());
  if (callback !== undefined) {
    callback(transformer);
  }
  return transformer;
}

export function shouldEquivalent(input: string, output: string, callback?: (transformer: Transformer<SimpleDocument>) => unknown): void {
  let parser = new DOMParser();
  let transformer = createTransformer(callback);
  expect(transformer.transform(parser.parseFromString(input)).toString()).toBe(output);
}

describe("transformation of simple documents", () => {
  test("basic", () => {
    shouldEquivalent($`
      <foo>
        <bar><foo/></bar>
      </foo>
    `, $`
      <foo-tr>
        <bar-tr><foo-tr/></bar-tr>
      </foo-tr>
    `, (transformer) => {
      transformer.registerElementRule("foo", true, (transformer, document, element) => {
        let self = document.createDocumentFragment();
        self.appendElement("foo-tr", (self) => {
          self.appendChild(transformer.apply(element, ""));
        });
        return self;
      });
      transformer.registerElementRule("bar", true, (transformer, document, element) => {
        let self = document.createDocumentFragment();
        self.appendElement("bar-tr", (self) => {
          self.appendChild(transformer.apply(element, ""));
        });
        return self;
      });
      transformer.registerTextRule(true, (transformer, document, text) => text.data);
    });
  });
});