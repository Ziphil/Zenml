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