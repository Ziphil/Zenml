//

import {
  NodeLikeOf,
  SuperDocumentLike
} from "../type/dom";


export interface LightTransformer<D extends SuperDocumentLike<D>> {

  configs: {[key: string]: any};
  variables: {[key: string]: any};

  apply(node: Element | Document, scope: string, args?: any): NodeLikeOf<D>;

  call(name: string, node: Element | Text, args?: any): NodeLikeOf<D>;

}