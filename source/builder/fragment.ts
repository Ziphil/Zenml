//
//

import {
  CreatableDocument
} from "./document";


export class Fragment<D extends CreatableDocument<E, T>, E, T> {

  private document: D;
  private nodes: Array<E | T>;

  public constructor(document: D) {
    this.document = document;
    this.nodes = [];
  }

  public appendChild<N extends NodeLike<D, E, T>>(node: N, callback?: NodeCallback<N>): N {
    callback?.(node);
    let anyNode = node as any;
    if (node instanceof Fragment) {
      this.nodes.push(...node.nodes);
    } else {
      this.nodes.push(anyNode);
    }
    return node;
  }

  public appendElement(name: string, callback?: NodeCallback<E>): E {
    let element = this.document.createElement(name);
    this.appendChild(element, callback);
    return element;
  }

  public appendTextNode(content: string, callback?: NodeCallback<T>): T {
    let text = this.document.createTextNode(content);
    this.appendChild(text, callback);
    return text;
  }

}


export type NodeCallback<N> = (node: N) => void;
export type NodeLike<D extends CreatableDocument<E, T>, E, T> = Fragment<D, E, T> | E | T;