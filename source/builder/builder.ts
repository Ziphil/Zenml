//

import {
  Fragment
} from "./fragment";
import {
  SimpleDocument,
  SimpleElement
} from "./simple";
import {
  DocumentLike,
  NodeCallback,
  NodeLike,
  ParentNodeLike
} from "./type";


export class BaseDocumentBuilder<D extends DocumentLike<E, T>, E, T> {

  protected readonly document!: D;

  public constructor(document: D) {
    this.document = document;
  }

  public appendChild<N extends NodeLike<D, E, T>>(parent: ParentNodeLike<E, T>, child: N, callback?: NodeCallback<N>): void {
    callback?.call(this, child);
    if (child instanceof Fragment) {
      for (let innerChild of child.nodes) {
        parent.appendChild(innerChild);
      }
    } else {
      let castChild = child as E | T;
      parent.appendChild(castChild);
    }
  }

  public appendElement(parent: ParentNodeLike<E, T>, tagName: string, callback?: NodeCallback<E>): void {
    let element = this.document.createElement(tagName);
    this.appendChild(parent, element, callback);
  }

  public appendTextNode(parent: ParentNodeLike<E, T>, content: string, callback?: NodeCallback<T>): void {
    let text = this.document.createTextNode(content);
    this.appendChild(parent, text, callback);
  }

  public createFragment(): Fragment<D, E, T> {
    return new Fragment(this.document);
  }

  public createElement(tagName: string): E {
    return this.document.createElement(tagName);
  }

  public createTextNode(content: string): T {
    return this.document.createTextNode(content);
  }

}


export class DocumentBuilder extends BaseDocumentBuilder<Document, Element, Text> {

}


export class SimpleDocumentBuilder extends BaseDocumentBuilder<SimpleDocument, SimpleElement, string> {

}