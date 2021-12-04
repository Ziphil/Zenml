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

  // Registers a plugin.
  // If a parser is passed as the third argument, the plugin to be registered will be initialized with the parser.
  public registerPlugin(name: string, plugin: ZenmlPluginLike, parser?: ZenmlParser): void {
    if (typeof plugin === "function") {
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

  public registerPluginManager(manager: ZenmlPluginManager, parser?: ZenmlParser): void {
    for (let [addedName, addedPlugin] of manager.plugins) {
      this.plugins.set(addedName, addedPlugin);
      if (parser !== undefined) {
        addedPlugin.initialize(parser);
      }
    }
  }

  public updateDocument(document: Document): void {
    for (let [, plugin] of this.plugins) {
      plugin.updateDocument(document);
    }
  }

  public getPlugin(name: string): ZenmlPlugin | null {
    return this.plugins.get(name) ?? null;
  }

}


export type ZenmlPluginLike = ZenmlPluginFunction | ZenmlPlugin;