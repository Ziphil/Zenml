//

import {
  NodeLikeOf,
  SuperDocumentLike
} from "../type/dom";


export interface LightTransformer<D extends SuperDocumentLike<D>, C, V> {

  configs: C;
  variables: V;

  apply(node?: Element, scope?: string, args?: any): NodeLikeOf<D>;

  call(name: string, node?: Element | Text, scope?: string, args?: any): NodeLikeOf<D>;

}