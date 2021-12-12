//

import {
  NodeCallback,
  NodeLike
} from "../type/dom";
import {
  BaseDocumentFragment,
  SimpleDocumentFragment
} from "./document-fragment";
import {
  BaseElement,
  SimpleElement
} from "./element";
import {
  BaseText,
  SimpleText
} from "./text";


export type BaseDocumentOptions = {
  includeDeclaration?: boolean,
  html?: boolean
};


export abstract class BaseDocument<D extends BaseDocument<D, F, E, T>, F extends BaseDocumentFragment<D, F, E, T>, E extends BaseElement<D, F, E, T>, T extends BaseText<D, F, E, T>> {

  protected readonly fragment: F;
  public readonly options: BaseDocumentOptions;

  public constructor(options?: BaseDocumentOptions) {
    this.fragment = this.createDocumentFragment();
    this.options = options ?? {};
  }

  public abstract createDocumentFragment(): F;

  public abstract createElement(tagName: string): E;

  public abstract createTextNode(content: string): T;

  public appendChild<N extends NodeLike<F, E, T>>(child: N, callback?: NodeCallback<N>): N {
    return this.fragment.appendChild(child, callback);
  }

  public appendElement(tagName: string, callback?: NodeCallback<E>): E {
    return this.fragment.appendElement(tagName, callback);
  }

  public appendTextNode(content: string, callback?: NodeCallback<T>): T {
    return this.fragment.appendTextNode(content, callback);
  }

  public toString(): string {
    let string = "";
    if (this.options.includeDeclaration) {
      if (this.options.html) {
        string += "<!DOCTYPE html>";
      } else {
        string += "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
      }
    }
    for (let node of this.fragment.nodes) {
      string += node.toString();
    }
    return string;
  }

}


export class SimpleDocument extends BaseDocument<SimpleDocument, SimpleDocumentFragment, SimpleElement, SimpleText> {

  public createDocumentFragment(): SimpleDocumentFragment {
    return new SimpleDocumentFragment(this);
  }

  public createElement(tagName: string): SimpleElement {
    return new SimpleElement(this, tagName);
  }

  public createTextNode(content: string): SimpleText {
    return new SimpleText(this, content);
  }

}
