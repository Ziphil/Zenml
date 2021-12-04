//

import {
  NodeLikeOf,
  SuperDocumentLike
} from "../type/dom";


export interface LightDocumentTransformer<D extends SuperDocumentLike<D>> {

  configs: {[key: string]: any};
  variables: {[key: string]: any};

  apply(node?: Element, scope?: string, args?: any): NodeLikeOf<D>;

  call(name: string, node?: Element | Text, scope?: string, args?: any): NodeLikeOf<D>;

}