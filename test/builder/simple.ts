//

import {
  BaseSimpleDocumentOptions,
  SimpleDocument,
  SimpleDocumentBuilder
} from "../../source";


export function createBuilder(options?: BaseSimpleDocumentOptions): [SimpleDocument, SimpleDocumentBuilder] {
  let document = new SimpleDocument(options);
  let builder = new SimpleDocumentBuilder(document);
  return [document, builder];
}

export function shouldEquivalent(input: SimpleDocument, output: string): void {
  expect(input.toString()).toBe(output);
}

describe("simple document builder (method style)", () => {
  test("simple 1", () => {
    let document = new SimpleDocument({includeDeclaration: false});
    document.appendElement("root", (self) => {
      self.appendElement("first");
      self.appendElement("second");
    });
    shouldEquivalent(document, `<root><first/><second/></root>`);
  });
  test("simple 2", () => {
    let document = new SimpleDocument({includeDeclaration: false});
    document.appendElement("root", (self) => {
      self.appendElement("first", (self) => {
        self.appendTextNode("text");
      });
      self.appendTextNode("foo");
    });
    shouldEquivalent(document, `<root><first>text</first>foo</root>`);
  });
  test("fragment", () => {
    let document = new SimpleDocument({includeDeclaration: false});
    let fragment = document.createFragment();
    fragment.appendElement("first", (self) => {
      self.appendElement("inner");
    });
    fragment.appendElement("second", (self) => {
      self.appendTextNode("text");
    });
    document.appendElement("root", (self) => {
      self.appendTextNode("before");
      self.appendChild(fragment);
      self.appendTextNode("after");
    });
    shouldEquivalent(document, `<root>before<first><inner/></first><second>text</second>after</root>`);
  });
});

describe("simple document builder (builder style)", () => {
  test("simple 1", () => {
    let [document, builder] = createBuilder({includeDeclaration: false});
    builder.appendElement(document, "root", (self) => {
      builder.appendElement(self, "first");
      builder.appendElement(self, "second");
    });
    shouldEquivalent(document, `<root><first/><second/></root>`);
  });
  test("simple 2", () => {
    let [document, builder] = createBuilder({includeDeclaration: false});
    builder.appendElement(document, "root", (self) => {
      builder.appendElement(self, "first", (self) => {
        builder.appendTextNode(self, "text");
      });
      builder.appendTextNode(self, "foo");
    });
    shouldEquivalent(document, `<root><first>text</first>foo</root>`);
  });
  test("fragment", () => {
    let [document, builder] = createBuilder({includeDeclaration: false});
    let fragment = builder.createFragment();
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