//

import {
  NodeLikeOf,
  SuperDocumentLike
} from "../type/dom";
import {
  AnyObject
} from "./transformer";


export interface LightTransformer<D extends SuperDocumentLike<D>, C = AnyObject, V = AnyObject> {

  environments: C;
  variables: V;

  apply(node?: Element, scope?: string, args?: any): NodeLikeOf<D>;

  processElement(element: Element, scope?: string, args?: any): NodeLikeOf<D>;

  processText(text: Text, scope?: string, args?: any): NodeLikeOf<D>;

  call(name: string, node?: Element | Text, scope?: string, args?: any): NodeLikeOf<D>;

}