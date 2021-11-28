//

import {
  XMLSerializer
} from "xmldom";
import {
  BaseZenmlParser
} from "../source";


let raw = String.raw;
let serializer = new XMLSerializer();

function compare(input: string, output: string): void {
  let parser = new BaseZenmlParser();
  expect(serializer.serializeToString(parser.tryParse(input))).toBe(output);
}

describe("minimal", () => {
  test("minimal", () => {
    compare(raw`texttext`, raw`texttext`);
    compare(raw`\element<text>`, raw`<element>text</element>`);
    compare(raw`\element||<no attr>`, raw`<element>no attr</element>`);
    compare(raw`\element|attr="val"|<text>`, raw`<element attr="val">text</element>`);
    compare(raw`\element|attr="val",foo="bar",neko="usa"|<text>`, raw`<element attr="val" foo="bar" neko="usa">text</element>`);
  });
});