//

import $ from "ts-dedent";
import {
  SimpleDocument
} from "../../source";


describe("stringification of simple dom", () => {
  test("elements and texts 1", () => {
    let document = new SimpleDocument({includeDeclaration: false});
    document.appendElement("element", (self) => {
      self.appendElement("inner");
    });
    expect(document.toString()).toBe(`<element><inner/></element>`);
  });
  test("elements and texts 2", () => {
    let document = new SimpleDocument({includeDeclaration: false});
    document.appendElement("element", (self) => {
      self.appendTextNode("text");
    });
    expect(document.toString()).toBe(`<element>text</element>`);
  });
  test("attributes", () => {
    let document = new SimpleDocument({includeDeclaration: false});
    document.appendElement("element", (self) => {
      self.setAttribute("attr", "val");
      self.setAttribute("foo", "bar");
    });
    expect(document.toString()).toBe(`<element attr="val" foo="bar"/>`);
  });
  test("xml declaration", () => {
    let document = new SimpleDocument({includeDeclaration: true});
    document.appendElement("element", (self) => {
      self.appendTextNode("text");
    });
    expect(document.toString()).toBe($`
      <?xml version="1.0" encoding="UTF-8"?>
      <element>text</element>
    `);
  });
  test("escapes in texts", () => {
    let document = new SimpleDocument({includeDeclaration: false});
    document.appendElement("element", (self) => {
      self.appendTextNode("< > & \" '");
    });
    expect(document.toString()).toBe(`<element>&lt; &gt; &amp; &quot; &apos;</element>`);
  });
  test("escapes in attribute values", () => {
    let document = new SimpleDocument({includeDeclaration: false});
    document.appendElement("element", (self) => {
      self.setAttribute("attr", "< > & \" '");
    });
    expect(document.toString()).toBe(`<element attr="&lt; &gt; &amp; &quot; &apos;"/>`);
  });
});