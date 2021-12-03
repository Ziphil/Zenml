//

import {
  DocumentFragmentOf,
  DocumentLike,
  ElementOf,
  NodeLikeOf,
  SuperDocumentLike,
  TextOf
} from "../type/dom";
import {
  StringPattern,
  matchString
} from "../util/pattern";
import {
  LightTransformer
} from "./light-transformer";


export class TransformTemplateManager<D extends SuperDocumentLike<D>> {

  private readonly elementRules: Array<[StringPattern, StringPattern, TransformRule<D, Element>]>;
  private readonly textRules: Array<[StringPattern, TransformRule<D, Text>]>;
  private readonly elementFactories: Map<string, TransformFactory<D, Element>>;
  private readonly textFactories: Map<string, TransformFactory<D, Text>>;

  public constructor() {
    this.elementRules = [];
    this.textRules = [];
    this.elementFactories = new Map();
    this.textFactories = new Map();
  }

  public registerElementRule(tagNamePattern: StringPattern, scopePattern: StringPattern, rule: TransformRule<D, Element>): void {
    this.elementRules.push([tagNamePattern, scopePattern, rule]);
  }

  public registerTextRule(scopePattern: StringPattern, rule: TransformRule<D, Text>): void {
    this.textRules.push([scopePattern, rule]);
  }

  public registerElementFactory(name: string, factory: TransformFactory<D, Element>): void {
    this.elementFactories.set(name, factory);
  }

  public registerTextFactory(name: string, factory: TransformFactory<D, Text>): void {
    this.textFactories.set(name, factory);
  }

  public regsiterTemplateManager(manager: TransformTemplateManager<D>): void {
    for (let addedRule of manager.elementRules) {
      this.elementRules.push(addedRule);
    }
    for (let addedRule of manager.textRules) {
      this.textRules.push(addedRule);
    }
    for (let [addedName, addedFactory] of manager.elementFactories) {
      this.elementFactories.set(addedName, addedFactory);
    }
    for (let [addedName, addedFactory] of manager.textFactories) {
      this.textFactories.set(addedName, addedFactory);
    }
  }

  public findElementRule(tagName: string, scope: string): TransformRule<D, Element> | null {
    for (let [tagNamePattern, scopePattern, rule] of this.elementRules) {
      if (matchString(tagName, tagNamePattern) && matchString(scope, scopePattern)) {
        return rule;
      }
    }
    return null;
  }

  public findTextRule(scope: string): TransformRule<D, Text> | null {
    for (let [scopePattern, rule] of this.textRules) {
      if (matchString(scope, scopePattern)) {
        return rule;
      }
    }
    return null;
  }

  public findElementFactory(name: string): TransformFactory<D, Element> | null {
    return this.elementFactories.get(name) ?? null;
  }

  public findTextFactory(name: string): TransformFactory<D, Text> | null {
    return this.textFactories.get(name) ?? null;
  }

}


export type TransformRule<D extends SuperDocumentLike<D>, N> = (transformer: LightTransformer<D>, document: D, node: N, scope: string, args: any) => NodeLikeOf<D>;
export type TransformFactory<D extends SuperDocumentLike<D>, N> = (transformer: LightTransformer<D>, document: D, node: N, args: any) => NodeLikeOf<D>;