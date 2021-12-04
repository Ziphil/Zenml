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
  LightDocumentTransformer
} from "./light-transformer";


export class DocumentTemplateManager<D extends SuperDocumentLike<D>> {

  private readonly elementRules: Array<[StringPattern, StringPattern, DocumentTemplateRule<D, Element>]>;
  private readonly textRules: Array<[StringPattern, DocumentTemplateRule<D, Text>]>;
  private readonly elementFactories: Map<string, DocumentTemplateFactory<D, Element>>;
  private readonly textFactories: Map<string, DocumentTemplateFactory<D, Text>>;

  public constructor() {
    this.elementRules = [];
    this.textRules = [];
    this.elementFactories = new Map();
    this.textFactories = new Map();
  }

  public registerElementRule(tagNamePattern: StringPattern, scopePattern: StringPattern, rule: DocumentTemplateRule<D, Element>): void {
    this.elementRules.push([tagNamePattern, scopePattern, rule]);
  }

  public registerTextRule(scopePattern: StringPattern, rule: DocumentTemplateRule<D, Text>): void {
    this.textRules.push([scopePattern, rule]);
  }

  public registerElementFactory(name: string, factory: DocumentTemplateFactory<D, Element>): void {
    this.elementFactories.set(name, factory);
  }

  public registerTextFactory(name: string, factory: DocumentTemplateFactory<D, Text>): void {
    this.textFactories.set(name, factory);
  }

  public regsiterTemplateManager(manager: DocumentTemplateManager<D>): void {
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

  public findElementRule(tagName: string, scope: string): DocumentTemplateRule<D, Element> | null {
    for (let [tagNamePattern, scopePattern, rule] of this.elementRules) {
      if (matchString(tagName, tagNamePattern) && matchString(scope, scopePattern)) {
        return rule;
      }
    }
    return null;
  }

  public findTextRule(scope: string): DocumentTemplateRule<D, Text> | null {
    for (let [scopePattern, rule] of this.textRules) {
      if (matchString(scope, scopePattern)) {
        return rule;
      }
    }
    return null;
  }

  public findElementFactory(name: string): DocumentTemplateFactory<D, Element> | null {
    return this.elementFactories.get(name) ?? null;
  }

  public findTextFactory(name: string): DocumentTemplateFactory<D, Text> | null {
    return this.textFactories.get(name) ?? null;
  }

}


export type DocumentTemplateRule<D extends SuperDocumentLike<D>, N> = (transformer: LightDocumentTransformer<D>, document: D, node: N, scope: string, args: any) => NodeLikeOf<D>;
export type DocumentTemplateFactory<D extends SuperDocumentLike<D>, N> = (transformer: LightDocumentTransformer<D>, document: D, node: N, scope: string, args: any) => NodeLikeOf<D>;