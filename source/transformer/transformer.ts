//

import {
  DocumentFragmentOf,
  DocumentLike,
  ElementOf,
  NodeLikeOf,
  TextOf
} from "../type/dom";
import {
  isElement,
  isText
} from "../util/dom";
import {
  TransformTemplateManager
} from "./template-manager";


export class Transformer<D extends DocumentLike<DocumentFragmentOf<D>, ElementOf<D>, TextOf<D>>> {

  public document: D;
  protected readonly implementation: () => D;
  protected readonly templateManager: TransformTemplateManager<D>;
  protected configs: {[key: string]: any};
  protected variables: {[key: string]: any};

  public constructor(implementation: () => D) {
    this.document = implementation();
    this.implementation = implementation;
    this.templateManager = new TransformTemplateManager();
    this.configs = {};
    this.variables = {};
  }

  public updateDocument(document?: D): void {
    this.document = document ?? this.implementation();
  }

  protected resetConfigs(): void {
    this.configs = {};
  }

  protected resetVariables(): void {
    this.variables = {};
  }

  public transform(input: Document, document?: D): D {
    this.updateDocument(document);
    this.document.appendChild(this.apply(input, ""));
    return this.document;
  }

  private apply(node: Element | Document, scope: string, args?: any): NodeLikeOf<D> {
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
      return rule(this, this.document, element, scope, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  private applyText(text: Text, scope: string, args?: any): NodeLikeOf<D> {
    let rule = this.templateManager.findTextRule(scope);
    if (rule !== null) {
      return rule(this, this.document, text, scope, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  private call(node: Element | Text, name: string, args?: any): NodeLikeOf<D> {
    if (isElement(node)) {
      return this.callElement(node, name, args);
    } else if (isText(node)) {
      return this.callText(node, name, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  private callElement(element: Element, name: string, args?: any): NodeLikeOf<D> {
    let factory = this.templateManager.findElementFactory(name);
    if (factory !== null) {
      return factory(this, this.document, element, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

  private callText(text: Text, name: string, args?: any): NodeLikeOf<D> {
    let factory = this.templateManager.findTextFactory(name);
    if (factory !== null) {
      return factory(this, this.document, text, args);
    } else {
      return this.document.createDocumentFragment();
    }
  }

}