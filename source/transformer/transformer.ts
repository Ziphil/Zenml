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


export type BaseTransformerOptions<D, C, V> = {
  initialEnvironments?: Partial<C>,
  initialVariables?: Partial<V>
};
export type BaseTransformerTransformOptions<D, C, V> = {
  initialScope?: string,
  initialVariables?: Partial<V>
};
export type AnyObject = {[key: string]: any};


export abstract class BaseTransformer<D extends SuperDocumentLike<D>, C = AnyObject, V = AnyObject> {

  public document: D;
  protected readonly implementation: () => D;
  protected readonly templateManager: TemplateManager<D, C, V>;
  protected environments!: C;
  protected variables!: V;

  public constructor(implementation: () => D, options?: BaseTransformerOptions<D, C, V>) {
    this.document = implementation();
    this.implementation = implementation;
    this.templateManager = new TemplateManager();
    this.resetEnvironments(options?.initialEnvironments);
    this.resetVariables(options?.initialVariables);
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

  public transform(input: Document, options?: BaseTransformerTransformOptions<D, C, V>): D {
    let initialScope = options?.initialScope ?? "";
    let document = this.document;
    this.updateDocument();
    this.resetVariables(options?.initialVariables);
    document.appendChild(this.apply(input, initialScope, null));
    return document;
  }

  public transformStringify(input: Document, options?: BaseTransformerTransformOptions<D, C, V>): string {
    let document = this.transform(input, options);
    let string = this.stringify(document);
    return string;
  }

  protected abstract stringify(document: D): string;

  private apply(node: Document | Element | Text, scope: string, args: any): NodeLikeOf<D> {
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

  private applyElement(element: Element, scope: string, args: any): NodeLikeOf<D> {
    let rule = this.templateManager.findElementRule(element.tagName, scope);
    if (rule !== null) {
      let lightTransformer = this.createLightTransformer(element, scope, args);
      return rule(lightTransformer, this.document, element, scope, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  private applyText(text: Text, scope: string, args: any): NodeLikeOf<D> {
    let rule = this.templateManager.findTextRule(scope);
    if (rule !== null) {
      let lightTransformer = this.createLightTransformer(text, scope, args);
      return rule(lightTransformer, this.document, text, scope, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  private call(name: string, node: Element | Text, scope: string, args: any): NodeLikeOf<D> {
    if (isElement(node)) {
      return this.callElement(name, node, scope, args);
    } else if (isText(node)) {
      return this.callText(name, node, scope, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  private callElement(name: string, element: Element, scope: string, args: any): NodeLikeOf<D> {
    let factory = this.templateManager.findElementFactory(name);
    if (factory !== null) {
      let lightTransformer = this.createLightTransformer(element, scope, args);
      return factory(lightTransformer, this.document, element, scope, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  private callText(name: string, text: Text, scope: string, args: any): NodeLikeOf<D> {
    let factory = this.templateManager.findTextFactory(name);
    if (factory !== null) {
      let lightTransformer = this.createLightTransformer(text, scope, args);
      return factory(lightTransformer, this.document, text, scope, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  protected updateDocument(): void {
    this.document = this.implementation();
  }

  protected abstract resetEnvironments(initialEnvironments?: Partial<C>): void;

  protected abstract resetVariables(initialVariables?: Partial<V>): void;

  protected createLightTransformer(currentNode: Element | Text, currentScope: string, currentArgs: any): LightTransformer<D, C, V> {
    let outerThis = this;
    let apply = function (node?: Element, scope?: string, args?: any): NodeLikeOf<D> {
      let defaultedNode = (node === undefined) ? currentNode : node;
      let defaultedScope = (scope === undefined) ? currentScope : scope;
      let defaultedArgs = (args === undefined) ? currentArgs : args;
      return outerThis.apply(defaultedNode, defaultedScope, defaultedArgs);
    };
    let call = function (name: string, node?: Element | Text, scope?: string, args?: any): NodeLikeOf<D> {
      let defaultedNode = (node === undefined) ? currentNode : node;
      let defaultedScope = (scope === undefined) ? currentScope : scope;
      let defaultedArgs = (args === undefined) ? currentArgs : args;
      return outerThis.call(name, defaultedNode, defaultedScope, defaultedArgs);
    };
    let lightTransformer = {environments: this.environments, variables: this.variables, apply, call};
    return lightTransformer;
  }

}


export class SimpleTransformer<D extends SuperDocumentLike<D>> extends BaseTransformer<D, AnyObject, AnyObject> {

  protected stringify(document: D): string {
    return document.toString();
  }

  protected resetEnvironments(initialEnvironments?: Partial<AnyObject>): void {
    this.environments = initialEnvironments ?? {};
  }

  protected resetVariables(initialVariables?: Partial<AnyObject>): void {
    this.variables = initialVariables ?? {};
  }

}