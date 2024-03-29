//

import $ from "ts-dedent";
import {
  SimpleZenmlPlugin
} from "../../source";
import {
  shouldEquivalent,
  shouldFail
} from "./util";


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
  test("more than one arguments", () => {
    shouldFail(`\\element<one><two><three>`);
    shouldFail(`\\element|attr="value"|<one><two>`);
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

describe("spaces in elements", () => {
  test("after tags", () => {
    shouldEquivalent(`\\element ;`, `<element/>`);
    shouldEquivalent(`\\element  |attr="value"|;`, `<element attr="value"/>`);
    shouldEquivalent(`\\element  <text>`, `<element>text</element>`);
    shouldEquivalent(`\\element |attr="value"|<text>`, `<element attr="value">text</element>`);
    shouldEquivalent(`\\element*  <text>`, `<element>text</element>`);
  });
  test("after attributes", () => {
    shouldEquivalent(`\\element|attr="value"|  ;`, `<element attr="value"/>`);
    shouldEquivalent(`\\element|attr="value"| <text>`, `<element attr="value">text</element>`);
  });
  test("inside attribute blocks", () => {
    shouldEquivalent(`\\element|  attr="value"|;`, `<element attr="value"/>`);
    shouldEquivalent(`\\element|attr="value" |;`, `<element attr="value"/>`);
    shouldEquivalent(`\\element| attr="value" |;`, `<element attr="value"/>`);
  });
  test("around attribute commas", () => {
    shouldEquivalent(`\\element|one="one", two="two"|;`, `<element one="one" two="two"/>`);
    shouldEquivalent(`\\element|one="one"  ,two="two"|;`, `<element one="one" two="two"/>`);
    shouldEquivalent(`\\element|one="one" ,  two="two" ,  three="three"|;`, `<element one="one" two="two" three="three"/>`);
  });
  test("around attribute equals", () => {
    shouldEquivalent(`\\element|attr= "value"|;`, `<element attr="value"/>`);
    shouldEquivalent(`\\element|attr  ="value"|;`, `<element attr="value"/>`);
    shouldEquivalent(`\\element|attr =  "value"|;`, `<element attr="value"/>`);
  });
  test("between arguments", () => {
    shouldEquivalent(`\\root<\\element+<one> <two>>`, `<root><element>one</element><element>two</element></root>`);
    shouldEquivalent(`\\root<\\element+<one> <two>   <three>>`, `<root><element>one</element><element>two</element><element>three</element></root>`);
  });
  test("after slash (not allowed)", () => {
    shouldFail(`\\  element;`);
  });
  test("between element name and mark (not allowed)", () => {
    shouldFail(`\\root<\\element +;>`);
  });
  test("complex", () => {
    shouldEquivalent($`
      \\root<\\element+ | foo= "foo" ,  bar = "bar" ,
        baz =  "baz"
        , qux  ="qux"
      |
      <one>
        <two>>
    `, $`
      <root><element foo="foo" bar="bar" baz="baz" qux="qux">one</element><element foo="foo" bar="bar" baz="baz" qux="qux">two</element></root>
    `);
  });
});

describe("special elements", () => {
  test("basic", () => {
    const options = {specialElementNames: {brace: "brace", bracket: "bracket", slash: "slash"}};
    shouldEquivalent(`{text}`, `<brace>text</brace>`, options);
    shouldEquivalent(`[text]`, `<bracket>text</bracket>`, options);
    shouldEquivalent(`/text/`, `<slash>text</slash>`, options);
  });
  test("nested", () => {
    const options = {specialElementNames: {brace: "brace", bracket: "bracket", slash: "slash"}};
    shouldEquivalent(`{aaa[bbb/ccc/ddd{eee}]fff/ggg/}`, `<brace>aaa<bracket>bbb<slash>ccc</slash>ddd<brace>eee</brace></bracket>fff<slash>ggg</slash></brace>`, options);
    shouldEquivalent(`{\\foo</te[xt]/outer/text/>}`, `<brace><foo><slash>te<bracket>xt</bracket></slash>outer<slash>text</slash></foo></brace>`, options);
    shouldEquivalent(`/\\foo</\\foo<ab/cd/ef>/>/`, `<slash><foo><slash><foo>ab<slash>cd</slash>ef</foo></slash></foo></slash>`, options);
  });
  test("partly specified", () => {
    const options = {specialElementNames: {brace: "brace"}};
    shouldEquivalent(`{text}`, `<brace>text</brace>`, options);
    shouldFail(`[text]`, options);
    shouldFail(`/text/`, options);
  });
});

describe("marks", () => {
  test("verbal", () => {
    shouldEquivalent(`\\foo~<&#;>`, `<foo>&amp;#;</foo>`);
    shouldEquivalent(`\\foo~<\\fake|attr="val"|<fake\`>>`, `<foo>\\fake|attr="val"|&lt;fake&gt;</foo>`);
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
            more \\baz<indented
        testtest>>
      >
    `, $`
      <foo>testtest<bar>
        indented
          more <baz>indented
      testtest</baz></bar></foo>
    `);
  });
  test("multiple", () => {
    shouldEquivalent(`\\root<\\foo+<1><2><3>>`, `<root><foo>1</foo><foo>2</foo><foo>3</foo></root>`);
    shouldEquivalent(`\\root<\\foo+|attr="value"|<1><2>>`, `<root><foo attr="value">1</foo><foo attr="value">2</foo></root>`);
    shouldEquivalent(`\\root<\\foo+;>`, `<root><foo/></root>`);
  });
});

describe("macros", () => {
  test("unregistered macros", () => {
    const plugin = new SimpleZenmlPlugin(() => []);
    shouldFail(`&unregistered<42>`, {}, (parser) => parser.registerPlugin("macro", plugin));
  });
});

describe("processing instructions", () => {
  test("zenml declaration", () => {
    shouldEquivalent(`\\zml?|version="1.1"|;`, ``);
  });
  test("invalid zenml declaration", () => {
    shouldFail(`\\zml?|version="1.1"|<text>`);
    shouldFail(`\\zml?|version="1.1"|<one><two>`);
    shouldFail(`\\zml?|version="1.1"|<>`);
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
  test("invalid processing instructions 1", () => {
    shouldFail(`\\instr?|attr="val"|<one><two>`);
  });
  test("invalid processing instructions 2", () => {
    shouldFail(`\\instr?|attr="val"|<\\element<not allowed>>`);
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
    shouldEquivalent("\\foo<`& `< `> `; `\" `{ `} `[ `] `/ `\\ `| `` `#>", "<foo>&amp; &lt; &gt; ; \" { } [ ] / \\ | ` #</foo>");
  });
  test("in strings", () => {
    shouldEquivalent("\\foo|attr=\"`& `< `> `; `\" `{ `} `[ `] `/ `\\ `| `` `#\"|;", "<foo attr=\"&amp; &lt; &gt; ; &quot; { } [ ] / \\ | ` #\"/>");
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