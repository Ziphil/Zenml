//

import {
  NodeLikeOf,
  SuperDocumentLike
} from "../type/dom";


export interface LightTransformer<D extends SuperDocumentLike<D>> {

  configs: {[key: string]: any};
  variables: {[key: string]: any};

  call(node: Element | Text, name: string, args?: any): NodeLikeOf<D>;

  apply(node: Element | Document, scope: string, args?: any): NodeLikeOf<D>;

}