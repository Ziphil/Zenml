//

import {
  NodeCallback,
  NodeLike
} from "../type/dom";
import type {
  BaseDocument,
  SimpleDocument
} from "./document";
import type {
  BaseElement,
  SimpleElement
} from "./element";


export class BaseDocumentFragment<D extends BaseDocument<D, F, E>, F extends BaseDocumentFragment<D, F, E>, E extends BaseElement<D, F, E>> {

  protected readonly document: D;
  public readonly nodes: Array<E | string>;

  public constructor(document: D) {
    this.document = document;
    this.nodes = [];
  }

  public appendChild<N extends NodeLike<F, E, string>>(child: N, callback?: NodeCallback<N>): N {
    callback?.call(this, child);
    if (child instanceof BaseDocumentFragment) {
      this.nodes.push(...child.nodes);
    } else {
      let castChild = child as E | string;
      this.nodes.push(castChild);
    }
    return child;
  }

  public appendElement(tagName: string, callback?: NodeCallback<E>): E {
    let element = this.document.createElement(tagName);
    this.appendChild(element, callback);
    return element;
  }

  public appendTextNode(content: string, callback?: NodeCallback<string>): string {
    let text = this.document.createTextNode(content);
    this.appendChild(text, callback);
    return text;
  }

}


export class SimpleDocumentFragment extends BaseDocumentFragment<SimpleDocument, SimpleDocumentFragment, SimpleElement> {

}