//

import {
  DocumentLike,
  NodeCallback,
  NodeLike
} from "./type";


export class Fragment<D extends DocumentLike<E, T>, E, T> {

  protected document: D;
  public nodes: Array<E | T>;

  public constructor(document: D) {
    this.document = document;
    this.nodes = [];
  }

  public appendChild<N extends NodeLike<D, E, T>>(node: N, callback?: NodeCallback<N>): N {
    callback?.call(this, node);
    if (node instanceof Fragment) {
      this.nodes.push(...node.nodes);
    } else {
      let castNode = node as E | T;
      this.nodes.push(castNode);
    }
    return node;
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