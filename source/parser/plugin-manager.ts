//

import type {
  ZenmlParser
} from "./parser";
import {
  SimpleZenmlPlugin,
  ZenmlPlugin,
  ZenmlPluginFunction
} from "./plugin";


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