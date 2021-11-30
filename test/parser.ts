//

import {
  DOMImplementation,
  XMLSerializer
} from "@xmldom/xmldom";
import Parsimmon from "parsimmon";
import {
  Parser
} from "parsimmon";
import $ from "ts-dedent";
import {
  Nodes,
  SimpleZenmlPlugin,
  ZenmlAttributes,
  ZenmlMarks,
  ZenmlParser,
  ZenmlParserOptions,
  ZenmlPlugin
} from "../source";


let implementation = new DOMImplementation();
let serializer = new XMLSerializer();

function createParser(options?: ZenmlParserOptions, plugins?: Array<[string, ZenmlPlugin]>): ZenmlParser {
  let parser = new ZenmlParser(implementation, options);
  if (plugins !== undefined) {
    for (let [name, plugin] of plugins) {
      parser.registerPlugin(name, plugin);
    }
  }
  return parser;
}

function shouldEquivalent(input: string, output: string, options?: ZenmlParserOptions, plugins?: Array<[string, ZenmlPlugin]>): void {
  let parser = createParser(options, plugins);
  expect(serializer.serializeToString(parser.tryParse(input))).toBe(output);
}

function shouldFail(input: string, options?: ZenmlParserOptions, plugins?: Array<[string, ZenmlPlugin]>): void {
  let parser = createParser(options, plugins);
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
  test("more than one arguments", () => {
    shouldFail(`\\element<one><two><three>`);
    shouldFail(`\\element|attr="value"|<one><two>`);
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
    shouldEquivalent(`{\\foo</te[xt]/outer/text/>}`, `<brace><foo><slash>te<bracket>xt</bracket></slash>outer<slash>text</slash></foo></brace>`, options);
    shouldEquivalent(`/\\foo</\\foo<ab/cd/ef>/>/`, `<slash><foo><slash><foo>ab<slash>cd</slash>ef</foo></slash></foo></slash>`, options);
  });
  test("partly specified", () => {
    let options = {specialElementNames: {brace: "brace"}};
    shouldEquivalent(`{text}`, `<brace>text</brace>`, options);
    shouldFail(`[text]`, options);
    shouldFail(`/text/`, options);
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
    shouldEquivalent(`\\foo+<1><2><3>`, `<foo>1</foo><foo>2</foo><foo>3</foo>`);
    shouldEquivalent(`\\foo+|attr="value"|<1><2>`, `<foo attr="value">1</foo><foo attr="value">2</foo>`);
    shouldEquivalent(`\\foo+;`, `<foo/>`);
  });
});

describe("macros and plugins", () => {
  test("test plugin", () => {
    let plugin = new TestZenmlPlugin();
    shouldEquivalent(`&macro<42>`, `<macro><digits>42</digits></macro>`, {}, [["macro", plugin]]);
    shouldEquivalent(`&macro<100><200>`, `<macro><digits>100</digits></macro>`, {}, [["macro", plugin]]);
    shouldFail(`&macro<nondigits>`, {}, [["macro", plugin]]);
  });
  test("simple plugin", () => {
    let plugin = new SimpleZenmlPlugin((document, name, marks, attributes, childrenList) => {
      let element = document.createElement("tr");
      for (let attribute of attributes) {
        element.setAttribute(attribute[0], attribute[1]);
      }
      for (let children of childrenList) {
        let innerElement = document.createElement("td");
        for (let child of children) {
          innerElement.appendChild(child);
        }
        element.appendChild(innerElement);
      }
      return [element];
    });
    shouldEquivalent(`&tr<one><two><three>`, `<tr><td>one</td><td>two</td><td>three</td></tr>`, {}, [["tr", plugin]]);
    shouldEquivalent(`&tr<one\\elem<inner>><two\\elem;>`, `<tr><td>one<elem>inner</elem></td><td>two<elem/></td></tr>`, {}, [["tr", plugin]]);
  });
  test("unregistered plugins", () => {
    let plugin = new TestZenmlPlugin();
    shouldFail(`&unregistered<42>`, {}, [["macro", plugin]]);
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


export class TestZenmlPlugin implements ZenmlPlugin {

  private document!: Document;

  public initialize(zenmlParser: ZenmlParser): void {
    this.document = zenmlParser.document;
  }

  public getParser(): Parser<Nodes> {
    let parser = Parsimmon.digits.map((string) => {
      let element = this.document.createElement("digits");
      let text = this.document.createTextNode(string);
      element.appendChild(text);
      return [element];
    });
    return parser;
  }

  public createElement(name: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenList: Array<Nodes>): Nodes {
    let element = this.document.createElement(name);
    let children = childrenList[0] ?? [];
    for (let attribute of attributes) {
      element.setAttribute(attribute[0], attribute[1]);
    }
    for (let child of children) {
      element.appendChild(child);
    }
    return [element];
  }

}