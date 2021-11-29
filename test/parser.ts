//

import {
  BaseZenmlParser,
  BaseZenmlParserOptions
} from "../source";
import {
  XMLSerializer
} from "../source/dom";
import {
  dedent as $
} from "./util";


let serializer = new XMLSerializer();

function shouldEquivalent(input: string, output: string, options?: BaseZenmlParserOptions): void {
  let parser = new BaseZenmlParser(options);
  expect(serializer.serializeToString(parser.tryParse(input))).toBe(output);
}

function shouldFail(input: string, options?: BaseZenmlParserOptions): void {
  let parser = new BaseZenmlParser(options);
  expect(() => parser.tryParse(input)).toThrow();
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
  test("no attributes", () => {
    shouldEquivalent(`\\element||<no attr>`, `<element>no attr</element>`);
  });
  test("boolean attributes", () => {
    shouldEquivalent(`\\element|bool|<text>`, `<element bool="bool">text</element>`);
    shouldEquivalent(`\\element|bool,another|<text>`, `<element bool="bool" another="another">text</element>`);
  });
  test("empty", () => {
    shouldEquivalent(`\\element;`, `<element/>`);
    shouldEquivalent(`\\element|attr="value"|;`, `<element attr="value"/>`);
  });
  test("complex", () => {
    shouldEquivalent(`\\nest<text\\nest<inner>text>`, `<nest>text<nest>inner</nest>text</nest>`);
    shouldEquivalent($`
      \\foo<\\bar<\\baz<neko>>>outer\\foo<\\bar<neko>>
      \\foo<
        neko\\bar<mofu>
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

describe("special elements", () => {
  test("basic", () => {
    let options = {specialElementNames: {brace: "brace", bracket: "bracket", slash: "slash"}};
    shouldEquivalent(`{text}`, `<brace>text</brace>`, options);
    shouldEquivalent(`[text]`, `<bracket>text</bracket>`, options);
    shouldEquivalent(`/text/`, `<slash>text</slash>`, options);
  });
  test("nested", () => {
    let options = {specialElementNames: {brace: "brace", bracket: "bracket", slash: "slash"}};
    shouldEquivalent(`{aaa[bbb/ccc/ddd{eee}]fff}/ggg/`, `<brace>aaa<bracket>bbb<slash>ccc</slash>ddd<brace>eee</brace></bracket>fff</brace><slash>ggg</slash>`, options);
    shouldEquivalent(`{\\foo</te[xt]/>}`, `<brace><foo><slash>te<bracket>xt</bracket></slash></foo></brace>`, options);
    shouldEquivalent(`/\\foo</\\foo<ab/cd/ef>/>/`, `<slash><foo><slash><foo>ab<slash>cd</slash>ef</foo></slash></foo></slash>`, options);
  });
});

describe("marks", () => {
  test("verbal", () => {
    shouldEquivalent(`\\foo~<&#;>`, `<foo>&amp;#;</foo>`);
    shouldEquivalent(`\\foo~<\\fake|attr="val"|<fake\`>>`, `<foo>\\fake|attr="val"|&lt;fake></foo>`);
  });
  test("trim", () => {
    shouldEquivalent($`
      \\foo*<
        testtest
          indented
            more indented
        testtest
      >
    `, $`
      <foo>testtest
        indented
          more indented
      testtest</foo>
    `);
    shouldEquivalent($`
      \\foo*<
        testtest\\bar<
          indented
            more> \\baz<indented
        testtest>
      >
    `, $`
      <foo>testtest<bar>
        indented
          more</bar> <baz>indented
      testtest</baz></foo>
    `);
  });
  test("multiple", () => {
    shouldEquivalent(`\\foo+<1><2><3>`, `<foo>1</foo><foo>2</foo><foo>3</foo>`);
    shouldEquivalent(`\\foo+|attr="value"|<1><2>`, `<foo attr="value">1</foo><foo attr="value">2</foo>`);
    shouldEquivalent(`\\foo+;`, `<foo/>`);
  });
});

describe("processing instructions", () => {
  test("zenml declaration", () => {
    shouldEquivalent(`\\zml?|version="1.1"|;`, ``);
  });
  test("xml declaration", () => {
    shouldEquivalent(`\\xml?|version="1.0",encoding="UTF-8"|;`, `<?xml version="1.0" encoding="UTF-8"?>`);
    shouldEquivalent($`
      \\xml?|version="1.0",encoding="UTF-8"|;
      \\foo<text>
    `, $`
      <?xml version="1.0" encoding="UTF-8"?>
      <foo>text</foo>
    `);
  });
  test("processing instructions", () => {
    shouldEquivalent(`\\instr?|attr="val",foo="bar"|<texttext>`, `<?instr attr="val" foo="bar" texttext?>`);
    shouldEquivalent(`\\instr?<\`<\`>>`, `<?instr <>?>`);
  });
});

describe("block comments", () => {
  test("basic", () => {
    shouldEquivalent(`#<comment>`, `<!--comment-->`);
    shouldEquivalent(`#<comment>outer#<another>`, `<!--comment-->outer<!--another-->`);
    shouldEquivalent(`\\foo<#<comment>outer>`, `<foo><!--comment-->outer</foo>`);
  });
  test("multiline", () => {
    shouldEquivalent($`
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
    shouldEquivalent($`
      text
      ##line comment
      text
    `, $`
      text
      <!--line comment-->text
    `);
    shouldEquivalent($`
      \\foo<
        ##\\foo<>
      >
    `, $`
      <foo>
        <!--\\foo<>--></foo>
    `);
  });
  test("ending at eof", () => {
    shouldEquivalent($`
      text
      ##line comment ends at eof
    `, $`
      text
      <!--line comment ends at eof-->
    `);
  });
});

describe("escapes", () => {
  test("in texts", () => {
    shouldEquivalent("`& `< `> `' `\" `{ `} `[ `] `/ `\\ `| `` `# `;", "&amp; &lt; > ' \" { } [ ] / \\ | ` # ;");
    shouldEquivalent("\\foo<`>>", "<foo>></foo>");
  });
  test("in strings", () => {
    shouldEquivalent("\\foo|attr=\"`& `< `> `' `\" `{ `} `[ `] `/ `\\ `| `` `# `;\"|;", "<foo attr=\"&amp; &lt; > ' &quot; { } [ ] / \\ | ` # ;\"/>");
  });
  test("invalid in texts", () => {
    shouldFail("`@");
    shouldFail("`s");
  });
  test("invalid in strings", () => {
    shouldFail("\\foo|attr=\"`@\"");
    shouldFail("\\foo|attr=\"`s\"");
  });
});