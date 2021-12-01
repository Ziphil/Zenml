//

import {
  Parser
} from "parsimmon";
import {
  DocumentBuilder
} from "../builder/builder";
import type {
  ChildrenArgs,
  Nodes,
  ZenmlAttributes,
  ZenmlMarks,
  ZenmlParser
} from "./parser";


export interface ZenmlPlugin {

  // このプラグインを ZenML パーサーに登録したときに一度だけ呼び出されます。
  initialize(zenmlParser: ZenmlParser): void;

  // マクロの引数をパースするパーサーを返します。
  // ZenML ドキュメントのパース処理中でマクロに出会う度に呼び出されます。
  getParser(): Parser<Nodes>;

  createElement(tagName: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenArgs: ChildrenArgs): Nodes;

}


export class SimpleZenmlPlugin {

  private zenmlParser!: ZenmlParser;
  private builder!: DocumentBuilder;
  private innerCreateElement: InnerCreateElement;

  public constructor(innerCreateElement: InnerCreateElement) {
    this.innerCreateElement = innerCreateElement;
  }

  public initialize(zenmlParser: ZenmlParser): void {
    this.zenmlParser = zenmlParser;
    this.builder = new DocumentBuilder(zenmlParser.document);
  }

  public getParser(): Parser<Nodes> {
    return this.zenmlParser.nodes({});
  }

  public createElement(tagName: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenArgs: ChildrenArgs): Nodes {
    return this.innerCreateElement(this.builder, tagName, marks, attributes, childrenArgs);
  }

}


export type InnerCreateElement = (builder: DocumentBuilder, tagName: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenArgs: ChildrenArgs) => Nodes;