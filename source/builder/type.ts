//

import type {
  Fragment
} from "./fragment";


export interface DocumentLike<E, T> {

  createElement(tagName: string): E;

  createTextNode(content: string): T;

}


export interface ParentNodeLike<E, T> {

  appendChild(child: E | T): void;

}


export type NodeCallback<N> = (node: N) => void;
export type NodeLike<D extends DocumentLike<E, T>, E, T> = Fragment<D, E, T> | E | T;