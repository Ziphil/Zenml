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

describe("elements and texts", () => {
  test("basic", () => {
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