//

import {
  SimpleDocument
} from "../simple-dom/document";
import {
  SimpleElement
} from "../simple-dom/element";
import {
  SimpleDocumentFragment
} from "../simple-dom/fragment";
import {
  DocumentLike,
  NodeCallback,
  NodeLike,
  ParentNodeLike
} from "./type";


export class BaseDocumentBuilder<D extends DocumentLike<F, E, T>, F, E, T> {

  protected readonly document!: D;

  public constructor(document: D) {
    this.document = document;
  }

  public appendChild<N extends NodeLike<F, E, T>>(parent: ParentNodeLike<F, E, T>, child: N, callback?: NodeCallback<N>): void {
    callback?.call(this, child);
    parent.appendChild(child);
  }

  public appendElement(parent: ParentNodeLike<F, E, T>, tagName: string, callback?: NodeCallback<E>): void {
    let element = this.document.createElement(tagName);
    this.appendChild(parent, element, callback);
  }

  public appendTextNode(parent: ParentNodeLike<F, E, T>, content: string, callback?: NodeCallback<T>): void {
    let text = this.document.createTextNode(content);
    this.appendChild(parent, text, callback);
  }

  public createDocumentFragment(): F {
    return this.document.createDocumentFragment();
  }

  public createElement(tagName: string): E {
    return this.document.createElement(tagName);
  }

  public createTextNode(content: string): T {
    return this.document.createTextNode(content);
  }

}


export class DocumentBuilder extends BaseDocumentBuilder<Document, DocumentFragment, Element, Text> {

}


export class SimpleDocumentBuilder extends BaseDocumentBuilder<SimpleDocument, SimpleDocumentFragment, SimpleElement, string> {

}