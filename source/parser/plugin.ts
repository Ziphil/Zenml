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

  // Called once when this plugin is registered to the ZenML parser.
  initialize(zenmlParser: ZenmlParser): void;

  // Called every time the document in the ZenML parser is updated.
  // Make sure that all the nodes returned by this plugin belong to this document.
  updateDocument(document: Document): void;

  // Returns the parser that parses each argument of the macro.
  // Called every time the ZenML parser visits a macro tag during the parsing process of a ZenML document.
  getParser(): Parser<Nodes>;

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