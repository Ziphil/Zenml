//

import {
  XMLSerializer
} from "xmldom";
import {
  BaseZenmlParser
} from "../source";
import {
  dedent
} from "./util";


let serializer = new XMLSerializer();

function compare(input: string, output: string): void {
  let parser = new BaseZenmlParser();
  expect(serializer.serializeToString(parser.tryParse(input))).toBe(output);
}

describe("elements and texts", () => {
  test("basic", () => {
    compare(dedent`texttext`, dedent`texttext`);
    compare(dedent`\element<text>`, dedent`<element>text</element>`);
  });
  test("with attributes", () => {
    compare(dedent`\element|attr="val"|<text>`, dedent`<element attr="val">text</element>`);
    compare(dedent`\element|attr="val",foo="bar",neko="mofu"|<text>`, dedent`<element attr="val" foo="bar" neko="mofu">text</element>`);
  });
  test("no attributes", () => {
    compare(dedent`\element||<no attr>`, dedent`<element>no attr</element>`);
  });
  test("boolean attributes", () => {
    compare(dedent`\element|bool|<text>`, dedent`<element bool="bool">text</element>`);
    compare(dedent`\element|bool,another|<text>`, dedent`<element bool="bool" another="another">text</element>`);
  });
  test("complex", () => {
    compare(dedent`\nest<text\nest<inner>text>`, dedent`<nest>text<nest>inner</nest>text</nest>`);
    compare(dedent`
      \foo<\bar<\baz<neko>>>outer\foo<\bar<neko>>
      \foo<
        neko\bar<mofu>
        neko
      >
    `, dedent`
      <foo><bar><baz>neko</baz></bar></foo>outer<foo><bar>neko</bar></foo>
      <foo>
        neko<bar>mofu</bar>
        neko
      </foo>
    `);
  });
});

describe("block comments", () => {
  test("basic", () => {
    compare(dedent`#<comment>`, dedent`<!--comment-->`);
    compare(dedent`#<comment>outer#<another>`, dedent`<!--comment-->outer<!--another-->`);
    compare(dedent`\foo<#<comment>outer>`, dedent`<foo><!--comment-->outer</foo>`);
  });
  test("multiline", () => {
    compare(dedent`
      #<
        multiline block comment
        second line
      >
    `, dedent`
      <!--
        multiline block comment
        second line
      -->
    `);
  });
});

describe("line comments", () => {
  test("basic", () => {
    compare(dedent`
      text
      ##line comment
      text
    `, dedent`
      text
      <!--line comment-->text
    `);
    compare(dedent`
      \foo<
        ##\foo<>
      >
    `, dedent`
      <foo>
        <!--\foo<>--></foo>
    `);
  });
  test("ending at eof", () => {
    compare(dedent`
      text
      ##line comment ends at eof
    `, dedent`
      text
      <!--line comment ends at eof-->
    `);
  });
});