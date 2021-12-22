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
  BaseElementOptions,
  SimpleElement
} from "./element";
import {
  BaseText,
  BaseTextOptions,
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

  protected abstract prepareDocumentFragment(): F;

  protected abstract prepareElement(tagName: string): E;

  protected abstract prepareTextNode(content: string): T;

  public createDocumentFragment(callback?: NodeCallback<F>): F {
    let fragment = this.prepareDocumentFragment();
    callback?.call(this, fragment);
    return fragment;
  }

  public createElement(tagName: string, callback?: NodeCallback<E>): E {
    let element = this.prepareElement(tagName);
    callback?.call(this, element);
    return element;
  }

  public createTextNode(content: string, callback?: NodeCallback<T>): T {
    let text = this.prepareTextNode(content);
    callback?.call(this, text);
    return text;
  }

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
        string += "<!DOCTYPE html>\n";
      } else {
        string += "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
      }
    }
    string += this.fragment.toString();
    return string;
  }

}


export class SimpleDocument extends BaseDocument<SimpleDocument, SimpleDocumentFragment, SimpleElement, SimpleText> {

  protected prepareDocumentFragment(): SimpleDocumentFragment {
    return new SimpleDocumentFragment(this);
  }

  protected prepareElement(tagName: string, options?: BaseElementOptions): SimpleElement {
    return new SimpleElement(this, tagName, options);
  }

  protected prepareTextNode(content: string, options?: BaseTextOptions): SimpleText {
    return new SimpleText(this, content, options);
  }

}
