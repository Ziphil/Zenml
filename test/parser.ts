//

import {
  XMLSerializer
} from "xmldom";
import {
  BaseZenmlParser
} from "../source";
import {
  $
} from "./util";


let serializer = new XMLSerializer();

function compare(input: string, output: string): void {
  let parser = new BaseZenmlParser();
  expect(serializer.serializeToString(parser.tryParse(input))).toBe(output);
}

describe("elements and texts", () => {
  test("basic", () => {
    compare($`texttext`, $`texttext`);
    compare($`\element<text>`, $`<element>text</element>`);
  });
  test("with attributes", () => {
    compare($`\element|attr="val"|<text>`, $`<element attr="val">text</element>`);
    compare($`\element|attr="val",foo="bar",neko="mofu"|<text>`, $`<element attr="val" foo="bar" neko="mofu">text</element>`);
  });
  test("no attributes", () => {
    compare($`\element||<no attr>`, $`<element>no attr</element>`);
  });
  test("boolean attributes", () => {
    compare($`\element|bool|<text>`, $`<element bool="bool">text</element>`);
    compare($`\element|bool,another|<text>`, $`<element bool="bool" another="another">text</element>`);
  });
  test("complex", () => {
    compare($`\nest<text\nest<inner>text>`, $`<nest>text<nest>inner</nest>text</nest>`);
    compare($`
      \foo<\bar<\baz<neko>>>outer\foo<\bar<neko>>
      \foo<
        neko\bar<mofu>
        neko
      >
    `, $`
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
    compare($`#<comment>`, $`<!--comment-->`);
    compare($`#<comment>outer#<another>`, $`<!--comment-->outer<!--another-->`);
    compare($`\foo<#<comment>outer>`, $`<foo><!--comment-->outer</foo>`);
  });
  test("multiline", () => {
    compare($`
      #<
        multiline block comment
        second line
      >
    `, $`
      <!--
        multiline block comment
        second line
      -->
    `);
  });
});

describe("line comments", () => {
  test("basic", () => {
    compare($`
      text
      ##line comment
      text
    `, $`
      text
      <!--line comment-->text
    `);
    compare($`
      \foo<
        ##\foo<>
      >
    `, $`
      <foo>
        <!--\foo<>--></foo>
    `);
  });
  test("ending at eof", () => {
    compare($`
      text
      ##line comment ends at eof
    `, $`
      text
      <!--line comment ends at eof-->
    `);
  });
});

describe("escapes", () => {
  test("in strings", () => {
  });
  test("in texts", () => {
  });
  test("invalid in strings", () => {
  });
  test("invalid in texts", () => {
  });
});