//

import {
  DOMImplementation,
  XMLSerializer
} from "@xmldom/xmldom";
import {
  Builder
} from "../../source";


const implementation = new DOMImplementation();
const serializer = new XMLSerializer();

export function createBuilder(): [Document, Builder] {
  const document = implementation.createDocument(null, null, null);
  const builder = new Builder(document);
  return [document, builder];
}

export function shouldEquivalent(input: Node, output: string): void {
  expect(serializer.serializeToString(input)).toBe(output);
}

describe("xml builder", () => {
  test("simple 1", () => {
    const [document, builder] = createBuilder();
    builder.appendElement(document, "root", (self) => {
      builder.appendElement(self, "first");
      builder.appendElement(self, "second");
    });
    shouldEquivalent(document, `<root><first/><second/></root>`);
  });
  test("simple 2", () => {
    const [document, builder] = createBuilder();
    builder.appendElement(document, "root", (self) => {
      builder.appendElement(self, "first", (self) => {
        builder.appendTextNode(self, "text");
      });
      builder.appendTextNode(self, "foo");
    });
    shouldEquivalent(document, `<root><first>text</first>foo</root>`);
  });
  test("fragment", () => {
    const [document, builder] = createBuilder();
    const fragment = builder.createDocumentFragment();
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

describe("xml builder and callbacks", () => {
  test("element", () => {
    const [document, builder] = createBuilder();
    const element = builder.createElement("element", (element) => {
      element.setAttribute("attr", "value");
    });
    builder.appendChild(document, element);
    shouldEquivalent(document, `<element attr="value"/>`);
  });
  test("text", () => {
    const [document, builder] = createBuilder();
    const element = builder.createTextNode("text", (text) => {
      text.data += "added";
    });
    builder.appendChild(document, element);
    shouldEquivalent(document, `textadded`);
  });
});