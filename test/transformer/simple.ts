//

import {
  DOMParser
} from "@xmldom/xmldom";
import $ from "ts-dedent";
import {
  SimpleDocument,
  SimpleTransformer,
  TemplateManager
} from "../../source";


const parser = new DOMParser();

function createTransformer(callback?: (transformer: SimpleTransformer<SimpleDocument>) => unknown): SimpleTransformer<SimpleDocument> {
  const transformer = new SimpleTransformer(() => new SimpleDocument());
  if (callback !== undefined) {
    callback(transformer);
  }
  return transformer;
}

export function shouldEquivalent(input: string, output: string, callback?: (transformer: SimpleTransformer<SimpleDocument>) => unknown): void {
  const transformer = createTransformer(callback);
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
      transformer.registerElementRule("foo", true, (transformer, document) => {
        const self = document.createDocumentFragment();
        self.appendElement("foo-tr", (self) => {
          self.appendChild(transformer.apply());
        });
        return self;
      });
      transformer.registerElementRule("bar", true, (transformer, document) => {
        const self = document.createDocumentFragment();
        self.appendElement("bar-tr", (self) => {
          self.appendChild(transformer.apply());
        });
        return self;
      });
      transformer.registerTextRule(true, (transformer, document, text) => {
        const self = document.createTextNode(text.data);
        return self;
      });
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
      transformer.registerElementRule("foo", true, (transformer, document) => {
        const self = document.createDocumentFragment();
        self.appendElement("foo-tr", (self) => {
          self.appendChild(transformer.apply());
          self.appendChild(transformer.call("fac"));
        });
        return self;
      });
      transformer.registerElementFactory("fac", (transformer, document) => {
        const self = document.createDocumentFragment();
        self.appendElement("fac");
        return self;
      });
      transformer.registerTextRule(true, (transformer, document, text) => {
        const self = document.createTextNode(text.data);
        return self;
      });
    });
  });
});

describe("patterns", () => {
  test("string", () => {
    shouldEquivalent(`<foo><foo/><bar/></foo>`, `<foo-tr><foo-tr/></foo-tr>`, (transformer) => {
      transformer.registerElementRule("foo", true, (transformer, document) => {
        const self = document.createDocumentFragment();
        self.appendElement("foo-tr", (self) => {
          self.appendChild(transformer.apply());
        });
        return self;
      });
    });
  });
  test("boolean", () => {
    shouldEquivalent(`<qux><foo/><bar/><baz/></qux>`, `<qux-tr><foo-tr/><bar-tr/><baz-tr/></qux-tr>`, (transformer) => {
      transformer.registerElementRule(true, true, (transformer, document, element) => {
        const self = document.createDocumentFragment();
        self.appendElement(`${element.tagName}-tr`, (self) => {
          self.appendChild(transformer.apply());
        });
        return self;
      });
    });
  });
  test("regexp", () => {
    shouldEquivalent(`<foo><foo/><foobar/><bar/></foo>`, `<foo-tr><foo-tr/><foobar-tr/></foo-tr>`, (transformer) => {
      transformer.registerElementRule(/^foo/, true, (transformer, document, element) => {
        const self = document.createDocumentFragment();
        self.appendElement(`${element.tagName}-tr`, (self) => {
          self.appendChild(transformer.apply());
        });
        return self;
      });
    });
  });
  test("function", () => {
    shouldEquivalent(`<qux><foo/><bar/><neko/></qux>`, `<qux-tr><foo-tr/><bar-tr/></qux-tr>`, (transformer) => {
      transformer.registerElementRule((tagName) => tagName.length === 3, true, (transformer, document, element) => {
        const self = document.createDocumentFragment();
        self.appendElement(`${element.tagName}-tr`, (self) => {
          self.appendChild(transformer.apply());
        });
        return self;
      });
    });
  });
  test("multiple", () => {
    shouldEquivalent(`<foo><foo/><foooo/><bar/><baz/><neko/></foo>`, `<foo-tr><foo-tr/><bar-tr/><neko-tr/></foo-tr>`, (transformer) => {
      transformer.registerElementRule(["foo", /^b.r$/, (tagName) => tagName.length === 4], true, (transformer, document, element) => {
        const self = document.createDocumentFragment();
        self.appendElement(`${element.tagName}-tr`, (self) => {
          self.appendChild(transformer.apply());
        });
        return self;
      });
    });
  });
});

describe("registration of templates", () => {
  test("via template manager", () => {
    const manager = new TemplateManager<SimpleDocument>();
    manager.registerElementRule("foo", true, (transformer, document) => {
      const self = document.createDocumentFragment();
      self.appendElement("foo-tr", (self) => {
        self.appendChild(transformer.apply());
        self.appendChild(transformer.call("fac"));
      });
      return self;
    });
    manager.registerElementFactory("fac", (transformer, document) => {
      const self = document.createDocumentFragment();
      self.appendElement("fac");
      return self;
    });
    manager.registerTextRule(true, (transformer, document, text) => {
      const self = document.createDocumentFragment();
      self.appendTextNode(text.data);
      self.appendChild(transformer.call("textfac"));
      return self;
    });
    manager.registerTextFactory("textfac", (transformer, document, text) => {
      const self = document.createTextNode("textfac");
      return self;
    });
    shouldEquivalent(`<foo>text</foo>`, `<foo-tr>texttextfac<fac/></foo-tr>`, (transformer) => transformer.regsiterTemplateManager(manager));
  });
});