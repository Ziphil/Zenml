//

import {
  NodeLikeOf,
  SuperDocumentLike
} from "../type/dom";


export interface LightTransformer<D extends SuperDocumentLike<D>, C, V> {

  environments: C;
  variables: V;

  apply(node?: Element, scope?: string, args?: any): NodeLikeOf<D>;

  processElement(element: Element, scope?: string, args?: any): NodeLikeOf<D>;

  processText(text: Text, scope?: string, args?: any): NodeLikeOf<D>;

  call(name: string, node?: Element | Text, scope?: string, args?: any): NodeLikeOf<D>;

}