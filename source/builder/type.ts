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

export type DocumentFragmentOf<D extends DocumentLike<any, any, any>> = ReturnType<D["createDocumentFragment"]>;
export type ElementOf<D extends DocumentLike<any, any, any>> = ReturnType<D["createElement"]>;
export type TextOf<D extends DocumentLike<any, any, any>> = ReturnType<D["createTextNode"]>;
export type NodeLikeOf<D extends DocumentLike<any, any, any>> = NodeLike<DocumentFragmentOf<D>, ElementOf<D>, TextOf<D>>;
export type ParentNodeLikeOf<D extends DocumentLike<any, any, any>> = ParentNodeLike<DocumentFragmentOf<D>, ElementOf<D>, TextOf<D>>;