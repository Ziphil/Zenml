//

import Parsimmon from "parsimmon";
import {
  Parser
} from "parsimmon";
import {
  ChildrenArgs,
  Nodes,
  ZenmlAttributes,
  ZenmlMarks,
  ZenmlParser,
  ZenmlPlugin,
  ZenmlPluginManager
} from "../../source";
import {
  shouldEquivalent,
  shouldFail
} from "./util";


class TestZenmlPlugin implements ZenmlPlugin {

  private document!: Document;

  public initialize(zenmlParser: ZenmlParser): void {
  }

  public updateDocument(document: Document): void {
    this.document = document;
  }

  public getParser(): Parser<Nodes> {
    const parser = Parsimmon.digits.map((string) => {
      const element = this.document.createElement("digits");
      const text = this.document.createTextNode(string);
      element.appendChild(text);
      return [element];
    });
    return parser;
  }

  public createElement(tagName: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenArgs: ChildrenArgs): Nodes {
    const element = this.document.createElement(tagName);
    const children = childrenArgs[0] ?? [];
    for (const [attributeName, attributeValue] of attributes) {
      element.setAttribute(attributeName, attributeValue);
    }
    for (const child of children) {
      element.appendChild(child);
    }
    return [element];
  }

}


describe("macros and plugins", () => {
  test("test plugin", () => {
    const plugin = new TestZenmlPlugin();
    shouldEquivalent(`&macro<42>`, `<macro><digits>42</digits></macro>`, {}, (parser) => parser.registerPlugin("macro", plugin));
    shouldEquivalent(`&macro<100><200>`, `<macro><digits>100</digits></macro>`, {}, (parser) => parser.registerPlugin("macro", plugin));
    shouldEquivalent(`\\root<&macro<100><200>>`, `<root><macro><digits>100</digits></macro></root>`, {}, (parser) => parser.registerPlugin("macro", plugin));
    shouldFail(`&macro<nondigits>`, {}, (parser) => parser.registerPlugin("macro", plugin));
  });
  test("simple plugin", () => {
    shouldEquivalent(`&tr<one\\elem<inner>><two\\elem;>`, `<tr><td>one<elem>inner</elem></td><td>two<elem/></td></tr>`, {}, (parser) => {
      parser.registerPlugin("tr", (builder, tagName, marks, attributes, childrenArgs) => {
        const element = builder.createElement("tr");
        for (const [attributeName, attributeValue] of attributes) {
          element.setAttribute(attributeName, attributeValue);
        }
        for (const children of childrenArgs) {
          const innerElement = builder.createElement("td");
          for (const child of children) {
            innerElement.appendChild(child);
          }
          element.appendChild(innerElement);
        }
        return [element];
      });
    });
  });
});

describe("registration of plugins", () => {
  test("via plugin manager", () => {
    const manager = new ZenmlPluginManager();
    manager.registerPlugin("macro", new TestZenmlPlugin());
    manager.registerPlugin("func", (builder, tagName, marks, attributes, childrenArgs) => {
      const element = builder.createElement(tagName);
      return [element];
    });
    shouldEquivalent(`&macro<42>`, `<macro><digits>42</digits></macro>`, {}, (parser) => parser.registerPluginManager(manager));
    shouldEquivalent(`&func<inner>`, `<func/>`, {}, (parser) => parser.registerPluginManager(manager));
  });
});