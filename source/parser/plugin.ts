//

import {
  Parser
} from "parsimmon";
import type {
  Nodes,
  ZenmlAttributes,
  ZenmlMark,
  ZenmlParser
} from "./parser";


export abstract class ZenmlPlugin {

  protected zenmlParser!: ZenmlParser;
  protected document!: Document;

  public abstract getParser(): Parser<Nodes>;

  public abstract createElement(marks: Array<ZenmlMark>, attributes: ZenmlAttributes, childrenList: Array<Nodes>): Nodes;

  public inheritZenmlParser(zenmlParser: ZenmlParser): void {
    this.zenmlParser = zenmlParser;
    this.document = zenmlParser.document;
  }

}