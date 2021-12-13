//

import {
  DOMImplementation,
  XMLSerializer
} from "@xmldom/xmldom";
import {
  Builder
} from "../../source";


let implementation = new DOMImplementation();
let serializer = new XMLSerializer();

export function createBuilder(): [Document, Builder] {
  let document = implementation.createDocument(null, null, null);
  let builder = new Builder(document);
  return [document, builder];
}

export function shouldEquivalent(input: Node, output: string): void {
  expect(serializer.serializeToString(input)).toBe(output);
}

describe("xml builder", () => {
  test("simple 1", () => {
    let [document, builder] = createBuilder();
    builder.appendElement(document, "root", (self) => {
      builder.appendElement(self, "first");
      builder.appendElement(self, "second");
    });
    shouldEquivalent(document, `<root><first/><second/></root>`);
  });
  test("simple 2", () => {
    let [document, builder] = createBuilder();
    builder.appendElement(document, "root", (self) => {
      builder.appendElement(self, "first", (self) => {
        builder.appendTextNode(self, "text");
      });
      builder.appendTextNode(self, "foo");
    });
    shouldEquivalent(document, `<root><first>text</first>foo</root>`);
  });
  test("fragment", () => {
    let [document, builder] = createBuilder();
    let fragment = builder.createDocumentFragment();
    builder.appendElement(fragment, "first", (self) => {
      builder.appendElement(self, "inner");
    });
    builder.appendElement(fragment, "second", (self) => {
      builder.appendTextNode(self, "text");
    });
    builder.appendElement(document, "root", (self) => {
      builder.appendTextNode(self, "before");
      builder.appendChild(self, fragment);
      builder.appendTextNode(self, "after");
    });
    shouldEquivalent(document, `<root>before<first><inner/></first><second>text</second>after</root>`);
  });
});