//


export interface DocumentLike<F, E, T> {

  createDocumentFragment(): F;

  createElement(tagName: string): E;

  createTextNode(content: string): T;

}


export interface ParentNodeLike<F, E, T> {

  appendChild(child: F | E | T): void;

}


export type NodeCallback<N> = (node: N) => void;
export type NodeLike<F, E, T> = F | E | T;