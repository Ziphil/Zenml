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


export type BaseTransformerOptions<D, C = AnyObject, V = AnyObject> = {
  initialEnvironments?: Partial<C>,
  initialVariables?: Partial<V>
};
export type BaseTransformerTransformOptions<D, C = AnyObject, V = AnyObject> = {
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
    const initialScope = options?.initialScope ?? "";
    const document = this.document;
    this.updateDocument();
    this.resetVariables(options?.initialVariables);
    document.appendChild(this.apply(input, initialScope, null));
    return document;
  }

  public transformStringify(input: Document, options?: BaseTransformerTransformOptions<D, C, V>): string {
    const document = this.transform(input, options);
    const string = this.stringify(document);
    return string;
  }

  protected abstract stringify(document: D): string;

  private apply(node: Document | Element | Text, scope: string, args: any): NodeLikeOf<D> {
    const resultNode = this.document.createDocumentFragment();
    for (let i = 0 ; i < node.childNodes.length ; i ++) {
      const child = node.childNodes.item(i);
      if (isElement(child)) {
        resultNode.appendChild(this.processElement(child, scope, args));
      } else if (isText(child)) {
        resultNode.appendChild(this.processText(child, scope, args));
      }
    };
    return resultNode;
  }

  private processElement(element: Element, scope: string, args: any): NodeLikeOf<D> {
    const rule = this.templateManager.findElementRule(element.tagName, scope);
    if (rule !== null) {
      const lightTransformer = this.createLightTransformer(element, scope, args);
      const resultNode = rule(lightTransformer, this.document, element, scope, args);
      return this.postprocess(resultNode, element, scope, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  private processText(text: Text, scope: string, args: any): NodeLikeOf<D> {
    const rule = this.templateManager.findTextRule(scope);
    if (rule !== null) {
      const lightTransformer = this.createLightTransformer(text, scope, args);
      const resultNode = rule(lightTransformer, this.document, text, scope, args);
      return this.postprocess(resultNode, text, scope, args);
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
    const factory = this.templateManager.findElementFactory(name);
    if (factory !== null) {
      const lightTransformer = this.createLightTransformer(element, scope, args);
      const resultNode = factory(lightTransformer, this.document, element, scope, args);
      return this.postprocess(resultNode, element, scope, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  private callText(name: string, text: Text, scope: string, args: any): NodeLikeOf<D> {
    const factory = this.templateManager.findTextFactory(name);
    if (factory !== null) {
      const lightTransformer = this.createLightTransformer(text, scope, args);
      const resultNode = factory(lightTransformer, this.document, text, scope, args);
      return this.postprocess(resultNode, text, scope, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  protected postprocess(resultNode: NodeLikeOf<D>, node: Element | Text, scope: string, args: any): NodeLikeOf<D> {
    return resultNode;
  }

  protected updateDocument(): void {
    this.document = this.implementation();
  }

  protected abstract resetEnvironments(initialEnvironments?: Partial<C>): void;

  protected abstract resetVariables(initialVariables?: Partial<V>): void;

  protected createLightTransformer(currentNode: Element | Text, currentScope: string, currentArgs: any): LightTransformer<D, C, V> {
    const outerThis = this;
    const apply = function (node?: Element, scope?: string, args?: any): NodeLikeOf<D> {
      const defaultedNode = (node === undefined) ? currentNode : node;
      const defaultedScope = (scope === undefined) ? currentScope : scope;
      const defaultedArgs = (args === undefined) ? currentArgs : args;
      return outerThis.apply(defaultedNode, defaultedScope, defaultedArgs);
    };
    const call = function (name: string, node?: Element | Text, scope?: string, args?: any): NodeLikeOf<D> {
      const defaultedNode = (node === undefined) ? currentNode : node;
      const defaultedScope = (scope === undefined) ? currentScope : scope;
      const defaultedArgs = (args === undefined) ? currentArgs : args;
      return outerThis.call(name, defaultedNode, defaultedScope, defaultedArgs);
    };
    const processElement = function (element: Element, scope?: string, args?: any): NodeLikeOf<D> {
      const defaultedScope = (scope === undefined) ? currentScope : scope;
      const defaultedArgs = (args === undefined) ? currentArgs : args;
      return outerThis.processElement(element, defaultedScope, defaultedArgs);
    };
    const processText = function (text: Text, scope?: string, args?: any): NodeLikeOf<D> {
      const defaultedScope = (scope === undefined) ? currentScope : scope;
      const defaultedArgs = (args === undefined) ? currentArgs : args;
      return outerThis.processText(text, defaultedScope, defaultedArgs);
    };
    const lightTransformer = {environments: this.environments, variables: this.variables, apply, call, processElement, processText};
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