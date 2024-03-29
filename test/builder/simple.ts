//

import {
  BaseDocumentOptions,
  SimpleBuilder,
  SimpleDocument
} from "../../source";


export function createBuilder(options?: BaseDocumentOptions): [SimpleDocument, SimpleBuilder] {
  const document = new SimpleDocument(options);
  const builder = new SimpleBuilder(document);
  return [document, builder];
}

export function shouldEquivalent(input: SimpleDocument, output: string): void {
  expect(input.toString()).toBe(output);
}

describe("simple document builder (method style)", () => {
  test("simple 1", () => {
    const document = new SimpleDocument({includeDeclaration: false});
    document.appendElement("root", (self) => {
      self.appendElement("first");
      self.appendElement("second");
    });
    shouldEquivalent(document, `<root><first/><second/></root>`);
  });
  test("simple 2", () => {
    const document = new SimpleDocument({includeDeclaration: false});
    document.appendElement("root", (self) => {
      self.appendElement("first", (self) => {
        self.appendTextNode("text");
      });
      self.appendTextNode("foo");
    });
    shouldEquivalent(document, `<root><first>text</first>foo</root>`);
  });
  test("fragment", () => {
    const document = new SimpleDocument({includeDeclaration: false});
    const fragment = document.createDocumentFragment();
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
    const [document, builder] = createBuilder({includeDeclaration: false});
    builder.appendElement(document, "root", (self) => {
      builder.appendElement(self, "first");
      builder.appendElement(self, "second");
    });
    shouldEquivalent(document, `<root><first/><second/></root>`);
  });
  test("simple 2", () => {
    const [document, builder] = createBuilder({includeDeclaration: false});
    builder.appendElement(document, "root", (self) => {
      builder.appendElement(self, "first", (self) => {
        builder.appendTextNode(self, "text");
      });
      builder.appendTextNode(self, "foo");
    });
    shouldEquivalent(document, `<root><first>text</first>foo</root>`);
  });
  test("fragment", () => {
    const [document, builder] = createBuilder({includeDeclaration: false});
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