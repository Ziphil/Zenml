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
  private pluginFunction: ZenmlPluginFunction;

  public constructor(pluginFunction: ZenmlPluginFunction) {
    this.pluginFunction = pluginFunction;
  }

  public initialize(zenmlParser: ZenmlParser): void {
    this.zenmlParser = zenmlParser;
    this.builder = new DocumentBuilder(zenmlParser.document);
  }

  public getParser(): Parser<Nodes> {
    return this.zenmlParser.nodes({});
  }

  public createElement(tagName: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenArgs: ChildrenArgs): Nodes {
    return this.pluginFunction(this.builder, tagName, marks, attributes, childrenArgs);
  }

}


export class ZenmlPluginManager {

  private readonly plugins: Map<string, ZenmlPlugin>;

  public constructor() {
    this.plugins = new Map();
  }

  // プラグインを登録します。
  // 第 3 引数の parser にパーサーが渡されると、登録されるプラグインをそのパーサーで初期化します。
  public registerPlugin(name: string, plugin: ZenmlPluginLike, parser?: ZenmlParser): void {
    if (plugin instanceof ZenmlPluginManager) {
      for (let [addedName, addedPlugin] of plugin.plugins) {
        this.plugins.set(addedName, addedPlugin);
        if (parser !== undefined) {
          addedPlugin.initialize(parser);
        }
      }
    } else if (typeof plugin === "function") {
      let addedPlugin = new SimpleZenmlPlugin(plugin);
      this.plugins.set(name, addedPlugin);
      if (parser !== undefined) {
        addedPlugin.initialize(parser);
      }
    } else {
      this.plugins.set(name, plugin);
      if (parser !== undefined) {
        plugin.initialize(parser);
      }
    }
  }

  public deregisterPlugin(name: string): void {
    this.plugins.delete(name);
  }

  public getPlugin(name: string): ZenmlPlugin | null {
    return this.plugins.get(name) ?? null;
  }

}


export type ZenmlPluginLike = ZenmlPluginManager | ZenmlPluginFunction | ZenmlPlugin;
export type ZenmlPluginFunction = (builder: DocumentBuilder, tagName: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenArgs: ChildrenArgs) => Nodes;