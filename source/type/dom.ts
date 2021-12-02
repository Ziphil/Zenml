//


export interface DocumentLike<F extends ParentNodeLike<F, E, T>, E, T> {

  createDocumentFragment(): F;

  createElement(tagName: string): E;

  createTextNode(content: string): T;

  appendChild(child: NodeLike<F, E, T>): void;

}


export interface ParentNodeLike<F, E, T> {

  appendChild(child: NodeLike<F, E, T>): void;

}


export type NodeCallback<N> = (node: N) => void;
export type NodeLike<F, E, T> = F | E | T;
export type AnyDocumentLike = DocumentLike<any, any, any>;

export type DocumentFragmentOf<D extends AnyDocumentLike> = ReturnType<D["createDocumentFragment"]> & ParentNodeLike<DocumentFragmentOf<D>, ElementOf<D>, TextOf<D>>;
export type ElementOf<D extends AnyDocumentLike> = ReturnType<D["createElement"]>;
export type TextOf<D extends AnyDocumentLike> = ReturnType<D["createTextNode"]>;
export type NodeLikeOf<D extends AnyDocumentLike> = NodeLike<DocumentFragmentOf<D>, ElementOf<D>, TextOf<D>>;
export type ParentNodeLikeOf<D extends AnyDocumentLike> = ParentNodeLike<DocumentFragmentOf<D>, ElementOf<D>, TextOf<D>>;