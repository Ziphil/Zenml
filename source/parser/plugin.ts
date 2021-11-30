//

import {
  Parser
} from "parsimmon";
import type {
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

  createElement(name: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenList: Array<Nodes>): Nodes;

}


export class SimpleZenmlPlugin {

  private zenmlParser!: ZenmlParser;
  private document!: Document;
  private innerCreateElement: (document: Document, name: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenList: Array<Nodes>) => Nodes;

  public constructor(innerCreateElement: (document: Document, name: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenList: Array<Nodes>) => Nodes) {
    this.innerCreateElement = innerCreateElement;
  }

  public initialize(zenmlParser: ZenmlParser): void {
    this.zenmlParser = zenmlParser;
    this.document = zenmlParser.document;
  }

  public getParser(): Parser<Nodes> {
    return this.zenmlParser.nodes({});
  }

  public createElement(name: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenList: Array<Nodes>): Nodes {
    return this.innerCreateElement(this.document, name, marks, attributes, childrenList);
  }

}