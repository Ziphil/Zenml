//

import {
  Parser
} from "parsimmon";
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
  private document!: Document;
  private innerCreateElement: (document: Document, tagName: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenArgs: ChildrenArgs) => Nodes;

  public constructor(innerCreateElement: (document: Document, tagName: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenArgs: ChildrenArgs) => Nodes) {
    this.innerCreateElement = innerCreateElement;
  }

  public initialize(zenmlParser: ZenmlParser): void {
    this.zenmlParser = zenmlParser;
    this.document = zenmlParser.document;
  }

  public getParser(): Parser<Nodes> {
    return this.zenmlParser.nodes({});
  }

  public createElement(tagName: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenArgs: ChildrenArgs): Nodes {
    return this.innerCreateElement(this.document, tagName, marks, attributes, childrenArgs);
  }

}