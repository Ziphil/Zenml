//

import {
  NodeCallback,
  NodeLike
} from "../builder/type";
import {
  BaseElement,
  SimpleElement
} from "./element";
import {
  BaseDocumentFragment,
  SimpleDocumentFragment
} from "./fragment";


export type BaseDocumentOptions = {
  includeDeclaration?: boolean;
};


export abstract class BaseDocument<D extends BaseDocument<D, F, E>, F extends BaseDocumentFragment<D, F, E>, E extends BaseElement<D, F, E>> {

  protected readonly fragment: F;
  protected readonly options: BaseDocumentOptions;

  public constructor(options?: BaseDocumentOptions) {
    this.fragment = this.createDocumentFragment();
    this.options = options ?? {};
  }

  public abstract createDocumentFragment(): F;

  public abstract createElement(tagName: string): E;

  public createTextNode(content: string): string {
    return content;
  }

  public appendChild<N extends NodeLike<F, E, string>>(child: N, callback?: NodeCallback<N>): N {
    return this.fragment.appendChild(child, callback);
  }

  public appendElement(tagName: string, callback?: NodeCallback<E>): E {
    return this.fragment.appendElement(tagName, callback);
  }

  public appendTextNode(content: string, callback?: NodeCallback<string>): string {
    return this.fragment.appendTextNode(content, callback);
  }

  public toString(): string {
    let string = "";
    if (this.options.includeDeclaration) {
      string += "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
    }
    for (let node of this.fragment.nodes) {
      string += node.toString();
    }
    return string;
  }

}


export class SimpleDocument extends BaseDocument<SimpleDocument, SimpleDocumentFragment, SimpleElement> {

  public createDocumentFragment(): SimpleDocumentFragment {
    return new SimpleDocumentFragment(this);
  }

  public createElement(tagName: string): SimpleElement {
    return new SimpleElement(this, tagName);
  }

}
