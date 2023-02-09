//

import {
  Parser
} from "parsimmon";
import {
  Builder
} from "../builder/builder";
import type {
  ChildrenArgs,
  Nodes,
  ZenmlAttributes,
  ZenmlMarks,
  ZenmlParser
} from "./parser";


export interface ZenmlPlugin {

  /** Called once when this plugin is registered to the ZenML parser. */
  initialize(zenmlParser: ZenmlParser): void;

  /** Called every time the ZenML parser starts parsing a ZenML document.
   * When you implement a ZenML plugin, make sure that all the nodes returned by this plugin belong to the argument passed as an argument. */
  updateDocument(document: Document): void;

  /** Returns the parser that parses the arguments of each macro.
   * Called every time the ZenML parser visits a macro element during the parsing process, and the returned parser is then used to parse the arguments */
  getParser(): Parser<Nodes>;

  /** Returns the node array that is the result of the transformation of the whole macro.
   * To `childrenArgs` is passed the result of parsing the arguments using the parser returned by the `getParser` method. */
  createElement(tagName: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenArgs: ChildrenArgs): Nodes;

}


export class SimpleZenmlPlugin implements ZenmlPlugin {

  private zenmlParser!: ZenmlParser;
  private builder!: Builder;
  private pluginFunction: ZenmlPluginFunction;

  public constructor(pluginFunction: ZenmlPluginFunction) {
    this.pluginFunction = pluginFunction;
  }

  public initialize(zenmlParser: ZenmlParser): void {
    this.zenmlParser = zenmlParser;
  }

  public updateDocument(document: Document): void {
    this.builder = new Builder(document);
  }

  public getParser(): Parser<Nodes> {
    return this.zenmlParser.nodes({});
  }

  public createElement(tagName: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenArgs: ChildrenArgs): Nodes {
    return this.pluginFunction(this.builder, tagName, marks, attributes, childrenArgs);
  }

}


export type ZenmlPluginFunction = (builder: Builder, tagName: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenArgs: ChildrenArgs) => Nodes;