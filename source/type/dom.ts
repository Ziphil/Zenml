//


export interface DocumentLike<F, E, T> {

  createDocumentFragment(): F & ParentNodeLike<F, E, T>;

  createElement(tagName: string): E;

  createTextNode(content: string): T;

  appendChild(child: NodeLike<F, E, T>): unknown;

}


export interface ParentNodeLike<F, E, T> {

  appendChild(child: NodeLike<F, E, T>): unknown;

}


export type NodeCallback<N> = (node: N) => void;
export type NodeLike<F, E, T> = F | E | T;
export type SuperDocumentLike<D extends SuperDocumentLike<D>> = DocumentLike<DocumentFragmentOf<D>, ElementOf<D>, TextOf<D>>;

export type DocumentFragmentOf<D extends DocumentLike<any, any, any>> = ReturnType<D["createDocumentFragment"]>;
export type ElementOf<D extends DocumentLike<any, any, any>> = ReturnType<D["createElement"]>;
export type TextOf<D extends DocumentLike<any, any, any>> = ReturnType<D["createTextNode"]>;
export type NodeLikeOf<D extends DocumentLike<any, any, any>> = NodeLike<DocumentFragmentOf<D>, ElementOf<D>, TextOf<D>>;
export type ParentNodeLikeOf<D extends DocumentLike<any, any, any>> = ParentNodeLike<DocumentFragmentOf<D>, ElementOf<D>, TextOf<D>>;