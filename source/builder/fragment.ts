//

import {
  DocumentLike,
  NodeCallback,
  NodeLike
} from "./type";


export class Fragment<D extends DocumentLike<E, T>, E, T> {

  protected readonly document: D;
  public readonly nodes: Array<E | T>;

  public constructor(document: D) {
    this.document = document;
    this.nodes = [];
  }

  public appendChild<N extends NodeLike<D, E, T>>(child: N, callback?: NodeCallback<N>): N {
    callback?.call(this, child);
    if (child instanceof Fragment) {
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

}