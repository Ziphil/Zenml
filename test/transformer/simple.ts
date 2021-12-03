//

import {
  DOMParser
} from "@xmldom/xmldom";
import $ from "ts-dedent";
import {
  SimpleDocument,
  TransformTemplateManager,
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
  test("call factories", () => {
    shouldEquivalent($`
      <foo>
        <foo>text</foo>
      </foo>
    `, $`
      <foo-tr>
        <foo-tr>text<fac/></foo-tr>
      <fac/></foo-tr>
    `, (transformer) => {
      transformer.registerElementRule("foo", true, (transformer, document, element) => {
        let self = document.createDocumentFragment();
        self.appendElement("foo-tr", (self) => {
          self.appendChild(transformer.apply(element, ""));
          self.appendChild(transformer.call(element, "fac"));
        });
        return self;
      });
      transformer.registerElementFactory("fac", (transformer, document, element) => {
        let self = document.createDocumentFragment();
        self.appendElement("fac");
        return self;
      });
      transformer.registerTextRule(true, (transformer, document, text) => text.data);
    });
  });
});

describe("registration of templates", () => {
  test("via template manager", () => {
    let manager = new TransformTemplateManager<SimpleDocument>();
    manager.registerElementRule("foo", true, (transformer, document, element) => {
      let self = document.createDocumentFragment();
      self.appendElement("foo-tr", (self) => {
        self.appendChild(transformer.apply(element, ""));
        self.appendChild(transformer.call(element, "fac"));
      });
      return self;
    });
    manager.registerElementFactory("fac", (transformer, document, element) => {
      let self = document.createDocumentFragment();
      self.appendElement("fac");
      return self;
    });
    manager.registerTextRule(true, (transformer, document, text) => {
      let self = document.createDocumentFragment();
      self.appendTextNode(text.data);
      self.appendChild(transformer.call(text, "textfac"));
      return self;
    });
    manager.registerTextFactory("textfac", (transformer, document, text) => "textfac");
    shouldEquivalent(`<foo>text</foo>`, `<foo-tr>texttextfac<fac/></foo-tr>`, (transformer) => transformer.regsiterTemplateManager(manager));
  });
});