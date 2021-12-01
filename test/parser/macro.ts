//

import Parsimmon from "parsimmon";
import {
  Parser
} from "parsimmon";
import {
  ChildrenArgs,
  Nodes,
  SimpleZenmlPlugin,
  ZenmlAttributes,
  ZenmlMarks,
  ZenmlParser,
  ZenmlPlugin
} from "../../source";
import {
  shouldEquivalent,
  shouldFail
} from "./util";


class TestZenmlPlugin implements ZenmlPlugin {

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

  public createElement(tagName: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenArgs: ChildrenArgs): Nodes {
    let element = this.document.createElement(tagName);
    let children = childrenArgs[0] ?? [];
    for (let [attributeName, attributeValue] of attributes) {
      element.setAttribute(attributeName, attributeValue);
    }
    for (let child of children) {
      element.appendChild(child);
    }
    return [element];
  }

}


describe("macros and plugins", () => {
  test("test plugin", () => {
    let plugin = new TestZenmlPlugin();
    shouldEquivalent(`&macro<42>`, `<macro><digits>42</digits></macro>`, {}, [["macro", plugin]]);
    shouldEquivalent(`&macro<100><200>`, `<macro><digits>100</digits></macro>`, {}, [["macro", plugin]]);
    shouldFail(`&macro<nondigits>`, {}, [["macro", plugin]]);
  });
  test("simple plugin", () => {
    let plugin = new SimpleZenmlPlugin((document, tagName, marks, attributes, childrenArgs) => {
      let element = document.createElement("tr");
      for (let [attributeName, attributeValue] of attributes) {
        element.setAttribute(attributeName, attributeValue);
      }
      for (let children of childrenArgs) {
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
});