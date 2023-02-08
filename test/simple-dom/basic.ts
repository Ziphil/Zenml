//

import $ from "ts-dedent";
import {
  SimpleDocument
} from "../../source";


describe("stringification", () => {
  test("elements and texts 1", () => {
    const document = new SimpleDocument({includeDeclaration: false});
    document.appendElement("element", (self) => {
      self.appendElement("inner");
    });
    expect(document.toString()).toBe(`<element><inner/></element>`);
  });
  test("elements and texts 2", () => {
    const document = new SimpleDocument({includeDeclaration: false});
    document.appendElement("element", (self) => {
      self.appendTextNode("text");
    });
    expect(document.toString()).toBe(`<element>text</element>`);
  });
  test("attributes", () => {
    const document = new SimpleDocument({includeDeclaration: false});
    document.appendElement("element", (self) => {
      self.setAttribute("attr", "val");
      self.setAttribute("foo", "bar");
    });
    expect(document.toString()).toBe(`<element attr="val" foo="bar"/>`);
  });
  test("xml declaration", () => {
    const document = new SimpleDocument({includeDeclaration: true});
    document.appendElement("element", (self) => {
      self.appendTextNode("text");
    });
    expect(document.toString()).toBe($`
      <?xml version="1.0" encoding="UTF-8"?>
      <element>text</element>
    `);
  });
  test("escapes in texts", () => {
    const document = new SimpleDocument({includeDeclaration: false});
    document.appendElement("element", (self) => {
      self.appendTextNode("< > & \" '");
    });
    expect(document.toString()).toBe(`<element>&lt; &gt; &amp; &quot; &apos;</element>`);
  });
  test("escapes in attribute values", () => {
    const document = new SimpleDocument({includeDeclaration: false});
    document.appendElement("element", (self) => {
      self.setAttribute("attr", "< > & \" '");
    });
    expect(document.toString()).toBe(`<element attr="&lt; &gt; &amp; &quot; &apos;"/>`);
  });
  test("raw texts", () => {
    const document = new SimpleDocument({includeDeclaration: false});
    document.appendElement("element", (self) => {
      self.appendChild(document.createTextNode("<raw>&amp;</raw>", (self) => {
        self.options.raw = true;
      }));
    });
    expect(document.toString()).toBe(`<element><raw>&amp;</raw></element>`);
  });
});

describe("stringification in html mode", () => {
  test("empty elements", () => {
    const document = new SimpleDocument({includeDeclaration: false, html: true});
    document.appendElement("element", (self) => {
      self.appendElement("inner");
    });
    expect(document.toString()).toBe(`<element><inner></inner></element>`);
    expect(document.toString()).not.toBe(`<element><inner/></element>`);
  });
  test("void elements 1", () => {
    const document = new SimpleDocument({includeDeclaration: false, html: true});
    document.appendElement("br");
    document.appendElement("hr");
    expect(document.toString()).toBe(`<br><hr>`);
    expect(document.toString()).not.toBe(`<br/><hr/>`);
    expect(document.toString()).not.toBe(`<br></br><hr></hr>`);
  });
  test("void elements 2", () => {
    const document = new SimpleDocument({includeDeclaration: false, html: true});
    document.appendElement("img", (self) => {
      self.setAttribute("src", "foo");
    });
    document.appendElement("input", (self) => {
      self.setAttribute("type", "text");
    });
    expect(document.toString()).toBe(`<img src="foo"><input type="text">`);
    expect(document.toString()).not.toBe(`<img src="foo"/><input type="text"/>`);
    expect(document.toString()).not.toBe(`<img src="foo"></img><input type="text"></input>`);
  });
  test("void elements with children", () => {
    const document = new SimpleDocument({includeDeclaration: false, html: true});
    document.appendElement("hr", (self) => {
      self.appendTextNode("text");
    });
    document.appendElement("img", (self) => {
      self.appendElement("span");
    });
    expect(document.toString()).toBe(`<hr><img>`);
    expect(document.toString()).not.toBe(`<hr>text</hr><img><span></span></img>`);
  });
  test("html declaration", () => {
    const document = new SimpleDocument({includeDeclaration: true, html: true});
    document.appendElement("element", (self) => {
      self.appendTextNode("text");
    });
    expect(document.toString()).toBe($`
      <!DOCTYPE html>
      <element>text</element>
    `);
  });
});