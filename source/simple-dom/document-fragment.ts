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
import type {
  BaseText,
  SimpleText
} from "./text";


export class BaseDocumentFragment<D extends BaseDocument<D, F, E, T>, F extends BaseDocumentFragment<D, F, E, T>, E extends BaseElement<D, F, E, T>, T extends BaseText<D, F, E, T>> {

  protected readonly document: D;
  public readonly nodes: Array<E | T>;

  public constructor(document: D) {
    this.document = document;
    this.nodes = [];
  }

  public appendChild<N extends NodeLike<F, E, T>>(child: N, callback?: NodeCallback<N>): N {
    callback?.call(this, child);
    if (child instanceof BaseDocumentFragment) {
      this.nodes.push(...child.nodes);
    } else {
      let castChild = child as E | T;
      this.nodes.push(castChild);
    }
    return child;
  }

  public appendElement(tagName: string, callback?: NodeCallback<E>): E {
    let element = this.document.createElement(tagName);
    this.appendChild(element, callback);
    return element;
  }

  public appendTextNode(content: string, callback?: NodeCallback<T>): T {
    let text = this.document.createTextNode(content);
    this.appendChild(text, callback);
    return text;
  }

  public toString(): string {
    let string = "";
    for (let node of this.nodes) {
      string += node.toString();
    }
    return string;
  }

}


export class SimpleDocumentFragment extends BaseDocumentFragment<SimpleDocument, SimpleDocumentFragment, SimpleElement, SimpleText> {

}