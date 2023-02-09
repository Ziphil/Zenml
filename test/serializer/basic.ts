//

import {
  DOMParser
} from "@xmldom/xmldom";
import $ from "ts-dedent";
import {
  ZenmlSerializer,
  ZenmlSerializerOptions
} from "../../source";


const parser = new DOMParser();

function createSerializer(options?: ZenmlSerializerOptions): ZenmlSerializer {
  const serializer = new ZenmlSerializer(options);
  return serializer;
}

export function shouldEquivalent(output: string, input: string, options?: ZenmlSerializerOptions): void {
  const serializer = createSerializer(options);
  expect(serializer.serialize(parser.parseFromString(input, "text/xml"))).toBe(output);
}

describe("nodes", () => {
  test("elements and texts", () => {
    shouldEquivalent(`texttext`, `texttext`);
    shouldEquivalent(`\\element<text>`, `<element>text</element>`);
  });
  test("with attributes", () => {
    shouldEquivalent(`\\element|attr="val"|<text>`, `<element attr="val">text</element>`);
    shouldEquivalent(`\\element|attr="val",foo="bar",neko="mofu"|<text>`, `<element attr="val" foo="bar" neko="mofu">text</element>`);
  });
  test("empty", () => {
    shouldEquivalent(`\\element;`, `<element/>`);
    shouldEquivalent(`\\element|attr="value"|;`, `<element attr="value"/>`);
  });
  test("comments", () => {
    shouldEquivalent(`#<comment>`, `<!--comment-->`);
    shouldEquivalent(`\\foo<#<comment>outer>`, `<foo><!--comment-->outer</foo>`);
  });
  test("CDATA sections", () => {
    shouldEquivalent(`\\element<text \`&\`<\`>>`, `<element><![CDATA[text &<>]]></element>`);
  });
  test("processing instructions", () => {
    shouldEquivalent(`\\xml?<version="1.0" encoding="UTF-8">`, `<?xml version="1.0" encoding="UTF-8"?>`);
  });
  test("complex", () => {
    shouldEquivalent(`\\nest<text\\nest<inner>text>`, `<nest>text<nest>inner</nest>text</nest>`);
    shouldEquivalent($`
      \\root<
        \\foo<\\bar<\\baz<neko>>>outer\\foo<\\bar<neko>>
        \\foo<
          neko\\bar<mofu>
          neko
        >
      >
    `, $`
      <root>
        <foo><bar><baz>neko</baz></bar></foo>outer<foo><bar>neko</bar></foo>
        <foo>
          neko<bar>mofu</bar>
          neko
        </foo>
      </root>
    `);
  });
});

describe("escapes", () => {
  test("in texts", () => {
    shouldEquivalent("\\foo<`& `< `> `; \" `{ `} `[ `] `/ `\\ | `` `#>", "<foo>&amp; &lt; &gt; ; \" { } [ ] / \\ | ` #</foo>");
  });
  test("in strings", () => {
    shouldEquivalent("\\foo|attr=\"& < > ; `\" { } [ ] / \\ | `` #\"|;", "<foo attr=\"&amp; &lt; &gt; ; &quot; { } [ ] / \\ | ` #\"/>");
  });
});

describe("options", () => {
  test("include declaration", () => {
    shouldEquivalent($`
      \\zml?|version="1.1"|;
      \\element<text>
    `, $`
      <element>text</element>
    `, {includeDeclaration: true});
  });
});