//

import {
  NodeLikeOf,
  SuperDocumentLike
} from "../type/dom";
import {
  isElement,
  isText
} from "../util/dom";
import {
  StringPattern
} from "../util/pattern";
import {
  LightTransformer
} from "./light-transformer";
import {
  TemplateFactory,
  TemplateManager,
  TemplateRule
} from "./template-manager";


export abstract class BaseTransformer<D extends SuperDocumentLike<D>, C = AnyObject, V = AnyObject> {

  public document: D;
  protected readonly implementation: () => D;
  protected readonly templateManager: TemplateManager<D, C, V>;
  protected environments!: C;
  protected variables!: V;

  public constructor(implementation: () => D) {
    this.document = implementation();
    this.implementation = implementation;
    this.templateManager = new TemplateManager();
    this.resetEnvironments();
    this.resetVariables();
  }

  public registerElementRule(tagNamePattern: StringPattern, scopePattern: StringPattern, rule: TemplateRule<D, C, V, Element>): void {
    this.templateManager.registerElementRule(tagNamePattern, scopePattern, rule);
  }

  public registerTextRule(scopePattern: StringPattern, rule: TemplateRule<D, C, V, Text>): void {
    this.templateManager.registerTextRule(scopePattern, rule);
  }

  public registerElementFactory(name: string, factory: TemplateFactory<D, C, V, Element>): void {
    this.templateManager.registerElementFactory(name, factory);
  }

  public registerTextFactory(name: string, factory: TemplateFactory<D, C, V, Text>): void {
    this.templateManager.registerTextFactory(name, factory);
  }

  public regsiterTemplateManager(manager: TemplateManager<D, C, V>): void {
    this.templateManager.regsiterTemplateManager(manager);
  }

  public transform(input: Document, variables?: V): D {
    this.updateDocument();
    this.resetVariables(variables);
    this.document.appendChild(this.apply(input, ""));
    return this.document;
  }

  private apply(node: Document | Element | Text, scope: string, args?: any): NodeLikeOf<D> {
    let resultNode = this.document.createDocumentFragment();
    for (let i = 0 ; i < node.childNodes.length ; i ++) {
      let child = node.childNodes.item(i);
      if (isElement(child)) {
        resultNode.appendChild(this.applyElement(child, scope, args));
      } else if (isText(child)) {
        resultNode.appendChild(this.applyText(child, scope, args));
      }
    };
    return resultNode;
  }

  private applyElement(element: Element, scope: string, args?: any): NodeLikeOf<D> {
    let rule = this.templateManager.findElementRule(element.tagName, scope);
    if (rule !== null) {
      let lightTransformer = this.createLightTransformer(element, scope);
      return rule(lightTransformer, this.document, element, scope, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  private applyText(text: Text, scope: string, args?: any): NodeLikeOf<D> {
    let rule = this.templateManager.findTextRule(scope);
    if (rule !== null) {
      let lightTransformer = this.createLightTransformer(text, scope);
      return rule(lightTransformer, this.document, text, scope, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  private call(name: string, node: Element | Text, scope: string, args?: any): NodeLikeOf<D> {
    if (isElement(node)) {
      return this.callElement(name, node, scope, args);
    } else if (isText(node)) {
      return this.callText(name, node, scope, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  private callElement(name: string, element: Element, scope: string, args?: any): NodeLikeOf<D> {
    let factory = this.templateManager.findElementFactory(name);
    if (factory !== null) {
      let lightTransformer = this.createLightTransformer(element, scope);
      return factory(lightTransformer, this.document, element, scope, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  private callText(name: string, text: Text, scope: string, args?: any): NodeLikeOf<D> {
    let factory = this.templateManager.findTextFactory(name);
    if (factory !== null) {
      let lightTransformer = this.createLightTransformer(text, scope);
      return factory(lightTransformer, this.document, text, scope, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  protected updateDocument(): void {
    this.document = this.implementation();
  }

  protected abstract resetEnvironments(): void;

  protected abstract resetVariables(variables?: V): void;

  protected createLightTransformer(currentNode: Element | Text, currentScope: string): LightTransformer<D, C, V> {
    let outerThis = this;
    let apply = function (node?: Element, scope?: string, args?: any): NodeLikeOf<D> {
      return outerThis.apply(node ?? currentNode, scope ?? currentScope, args);
    };
    let call = function (name: string, node?: Element | Text, scope?: string, args?: any): NodeLikeOf<D> {
      return outerThis.call(name, node ?? currentNode, scope ?? currentScope, args);
    };
    let lightTransformer = {environments: this.environments, variables: this.variables, apply, call};
    return lightTransformer;
  }

}


export class SimpleTransformer<D extends SuperDocumentLike<D>> extends BaseTransformer<D, AnyObject, AnyObject> {

  protected resetEnvironments(): void {
    this.environments = {};
  }

  protected resetVariables(variables?: AnyObject): void {
    this.variables = variables ?? {};
  }

}


export type AnyObject = {[key: string]: any};