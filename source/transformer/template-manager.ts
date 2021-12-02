//

import {
  DocumentFragmentOf,
  DocumentLike,
  ElementOf,
  NodeCallback,
  NodeLikeOf,
  ParentNodeLikeOf,
  TextOf
} from "../builder/type";
import {
  NodeLike
} from "../builder/type";
import {
  StringPattern,
  matchString
} from "./pattern";
import type {
  Transformer
} from "./transformer";


export class TransformTemplateManager<D extends DocumentLike<any, any, any>> {

  private readonly rules: Array<[StringPattern, StringPattern, TransformRule<D>]>;
  private readonly factories: Map<string, TransformFactory<D>>;

  public constructor() {
    this.rules = [];
    this.factories = new Map();
  }

  public registerRule(tagNamePattern: StringPattern, scopePattern: StringPattern, rule: TransformRule<D>): void {
    this.rules.push([tagNamePattern, scopePattern, rule]);
  }

  public registerFactory(name: string, factory: TransformFactory<D>): void {
    this.factories.set(name, factory);
  }

  public regsiterTemplateManager(manager: TransformTemplateManager<D>): void {
    for (let addedRule of manager.rules) {
      this.rules.push(addedRule);
    }
    for (let [addedName, addedFunction] of manager.factories) {
      this.factories.set(addedName, addedFunction);
    }
  }

  public findRule(tagName: string, scope: string): TransformRule<D> | null {
    for (let [tagNamePattern, scopePattern, rule] of this.rules) {
      if (matchString(tagName, tagNamePattern) && matchString(scope, scopePattern)) {
        return rule;
      }
    }
    return null;
  }

  public findFactory(name: string): TransformFactory<D> | null {
    return this.factories.get(name) ?? null;
  }

}


export type TransformRule<D extends DocumentLike<any, any, any>> = (transformer: Transformer<D>, document: D, element: ElementOf<D>, scope: string, args: any) => NodeLikeOf<D>;
export type TransformFactory<D extends DocumentLike<any, any, any>> = (transformer: Transformer<D>, document: D, element: ElementOf<D>, args: any) => NodeLikeOf<D>;