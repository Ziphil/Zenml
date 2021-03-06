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


function createTransformer(callback?: (transformer: SimpleTransformer<SimpleDocument>) => unknown): SimpleTransformer<SimpleDocument> {
  let transformer = new SimpleTransformer(() => new SimpleDocument());
  if (callback !== undefined) {
    callback(transformer);
  }
  return transformer;
}

export function shouldEquivalent(input: string, output: string, callback?: (transformer: SimpleTransformer<SimpleDocument>) => unknown): void {
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
      transformer.registerElementRule("foo", true, (transformer, document) => {
        let self = document.createDocumentFragment();
        self.appendElement("foo-tr", (self) => {
          self.appendChild(transformer.apply());
        });
        return self;
      });
      transformer.registerElementRule("bar", true, (transformer, document) => {
        let self = document.createDocumentFragment();
        self.appendElement("bar-tr", (self) => {
          self.appendChild(transformer.apply());
        });
        return self;
      });
      transformer.registerTextRule(true, (transformer, document, text) => {
        let self = document.createTextNode(text.data);
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
        let self = document.createDocumentFragment();
        self.appendElement("foo-tr", (self) => {
          self.appendChild(transformer.apply());
          self.appendChild(transformer.call("fac"));
        });
        return self;
      });
      transformer.registerElementFactory("fac", (transformer, document) => {
        let self = document.createDocumentFragment();
        self.appendElement("fac");
        return self;
      });
      transformer.registerTextRule(true, (transformer, document, text) => {
        let self = document.createTextNode(text.data);
        return self;
      });
    });
  });
});

describe("patterns", () => {
  test("string", () => {
    shouldEquivalent(`<foo/>`, `<foo-tr/>`, (transformer) => {
      transformer.registerElementRule("foo", true, (transformer, document) => {
        let self = document.createDocumentFragment();
        self.appendElement("foo-tr", (self) => {
          self.appendChild(transformer.apply());
        });
        return self;
      });
    });
  });
  test("boolean", () => {
    shouldEquivalent(`<foo/><bar/><baz/>`, `<foo-tr/><bar-tr/><baz-tr/>`, (transformer) => {
      transformer.registerElementRule(true, true, (transformer, document, element) => {
        let self = document.createDocumentFragment();
        self.appendElement(`${element.tagName}-tr`, (self) => {
          self.appendChild(transformer.apply());
        });
        return self;
      });
    });
  });
  test("regexp", () => {
    shouldEquivalent(`<foo/><foobar/><bar/>`, `<foo-tr/><foobar-tr/>`, (transformer) => {
      transformer.registerElementRule(/^foo/, true, (transformer, document, element) => {
        let self = document.createDocumentFragment();
        self.appendElement(`${element.tagName}-tr`, (self) => {
          self.appendChild(transformer.apply());
        });
        return self;
      });
    });
  });
  test("function", () => {
    shouldEquivalent(`<foo/><bar/><neko/>`, `<foo-tr/><bar-tr/>`, (transformer) => {
      transformer.registerElementRule((tagName) => tagName.length === 3, true, (transformer, document, element) => {
        let self = document.createDocumentFragment();
        self.appendElement(`${element.tagName}-tr`, (self) => {
          self.appendChild(transformer.apply());
        });
        return self;
      });
    });
  });
  test("multiple", () => {
    shouldEquivalent(`<foo/><foooo/><bar/><baz/><neko/>`, `<foo-tr/><bar-tr/><neko-tr/>`, (transformer) => {
      transformer.registerElementRule(["foo", /^b.r$/, (tagName) => tagName.length === 4], true, (transformer, document, element) => {
        let self = document.createDocumentFragment();
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
    let manager = new TemplateManager<SimpleDocument>();
    manager.registerElementRule("foo", true, (transformer, document) => {
      let self = document.createDocumentFragment();
      self.appendElement("foo-tr", (self) => {
        self.appendChild(transformer.apply());
        self.appendChild(transformer.call("fac"));
      });
      return self;
    });
    manager.registerElementFactory("fac", (transformer, document) => {
      let self = document.createDocumentFragment();
      self.appendElement("fac");
      return self;
    });
    manager.registerTextRule(true, (transformer, document, text) => {
      let self = document.createDocumentFragment();
      self.appendTextNode(text.data);
      self.appendChild(transformer.call("textfac"));
      return self;
    });
    manager.registerTextFactory("textfac", (transformer, document, text) => {
      let self = document.createTextNode("textfac");
      return self;
    });
    shouldEquivalent(`<foo>text</foo>`, `<foo-tr>texttextfac<fac/></foo-tr>`, (transformer) => transformer.regsiterTemplateManager(manager));
  });
});