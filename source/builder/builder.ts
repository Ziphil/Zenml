//

import {
  SimpleDocument
} from "../simple-dom/document";
import {
  DocumentFragmentOf,
  ElementOf,
  NodeCallback,
  NodeLikeOf,
  ParentNodeLikeOf,
  SuperDocumentLike,
  TextOf
} from "../type/dom";


export class BaseBuilder<D extends SuperDocumentLike<D>> {

  protected readonly document!: D;

  public constructor(document: D) {
    this.document = document;
  }

  public appendChild<N extends NodeLikeOf<D>>(parent: ParentNodeLikeOf<D>, child: N, callback?: NodeCallback<N>): void {
    callback?.call(this, child);
    parent.appendChild(child);
  }

  public appendElement(parent: ParentNodeLikeOf<D>, tagName: string, callback?: NodeCallback<ElementOf<D>>): void {
    const element = this.document.createElement(tagName);
    this.appendChild(parent, element, callback);
  }

  public appendTextNode(parent: ParentNodeLikeOf<D>, content: string, callback?: NodeCallback<TextOf<D>>): void {
    const text = this.document.createTextNode(content);
    this.appendChild(parent, text, callback);
  }

  public createDocumentFragment(callback?: NodeCallback<DocumentFragmentOf<D>>): DocumentFragmentOf<D> {
    const fragment = this.document.createDocumentFragment();
    callback?.call(this, fragment);
    return fragment;
  }

  public createElement(tagName: string, callback?: NodeCallback<ElementOf<D>>): ElementOf<D> {
    const element = this.document.createElement(tagName);
    callback?.call(this, element);
    return element;
  }

  public createTextNode(content: string, callback?: NodeCallback<TextOf<D>>): TextOf<D> {
    const text = this.document.createTextNode(content);
    callback?.call(this, text);
    return text;
  }

}


export class Builder extends BaseBuilder<Document> {

}


export class SimpleBuilder extends BaseBuilder<SimpleDocument> {

}