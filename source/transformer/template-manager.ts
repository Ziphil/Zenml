//

import {
  NodeLikeOf,
  SuperDocumentLike
} from "../type/dom";
import {
  StringPattern,
  matchString
} from "../util/pattern";
import {
  LightTransformer
} from "./light-transformer";
import type {
  AnyObject
} from "./transformer";


export class TemplateManager<D extends SuperDocumentLike<D>, C = AnyObject, V = AnyObject> {

  private readonly elementRules: Array<[StringPattern, StringPattern, TemplateRule<D, C, V, Element>]>;
  private readonly textRules: Array<[StringPattern, TemplateRule<D, C, V, Text>]>;
  private readonly elementFactories: Map<string, TemplateFactory<D, C, V, Element>>;
  private readonly textFactories: Map<string, TemplateFactory<D, C, V, Text>>;

  public constructor() {
    this.elementRules = [];
    this.textRules = [];
    this.elementFactories = new Map();
    this.textFactories = new Map();
  }

  public registerElementRule(tagNamePattern: StringPattern, scopePattern: StringPattern, rule: TemplateRule<D, C, V, Element>): void {
    this.elementRules.push([tagNamePattern, scopePattern, rule]);
  }

  public registerTextRule(scopePattern: StringPattern, rule: TemplateRule<D, C, V, Text>): void {
    this.textRules.push([scopePattern, rule]);
  }

  public registerElementFactory(name: string, factory: TemplateFactory<D, C, V, Element>): void {
    this.elementFactories.set(name, factory);
  }

  public registerTextFactory(name: string, factory: TemplateFactory<D, C, V, Text>): void {
    this.textFactories.set(name, factory);
  }

  public regsiterTemplateManager(manager: TemplateManager<D, C, V>): void {
    for (const addedRule of manager.elementRules) {
      this.elementRules.push(addedRule);
    }
    for (const addedRule of manager.textRules) {
      this.textRules.push(addedRule);
    }
    for (const [addedName, addedFactory] of manager.elementFactories) {
      this.elementFactories.set(addedName, addedFactory);
    }
    for (const [addedName, addedFactory] of manager.textFactories) {
      this.textFactories.set(addedName, addedFactory);
    }
  }

  public findElementRule(tagName: string, scope: string): TemplateRule<D, C, V, Element> | null {
    for (const [tagNamePattern, scopePattern, rule] of this.elementRules) {
      if (matchString(tagName, tagNamePattern) && matchString(scope, scopePattern)) {
        return rule;
      }
    }
    return null;
  }

  public findTextRule(scope: string): TemplateRule<D, C, V, Text> | null {
    for (const [scopePattern, rule] of this.textRules) {
      if (matchString(scope, scopePattern)) {
        return rule;
      }
    }
    return null;
  }

  public findElementFactory(name: string): TemplateFactory<D, C, V, Element> | null {
    return this.elementFactories.get(name) ?? null;
  }

  public findTextFactory(name: string): TemplateFactory<D, C, V, Text> | null {
    return this.textFactories.get(name) ?? null;
  }

}


export type TemplateRule<D extends SuperDocumentLike<D>, C, V, N> = (transformer: LightTransformer<D, C, V>, document: D, node: N, scope: string, args: any) => NodeLikeOf<D>;
export type TemplateFactory<D extends SuperDocumentLike<D>, C, V, N> = (transformer: LightTransformer<D, C, V>, document: D, node: N, scope: string, args: any) => NodeLikeOf<D>;