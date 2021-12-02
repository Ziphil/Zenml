//

import {
  SimpleDocument
} from "../simple-dom/document";
import {
  DocumentFragmentOf,
  DocumentLike,
  ElementOf,
  NodeCallback,
  NodeLikeOf,
  ParentNodeLikeOf,
  TextOf
} from "./type";


export class BaseDocumentBuilder<D extends DocumentLike<any, any, any>> {

  protected readonly document!: D;

  public constructor(document: D) {
    this.document = document;
  }

  public appendChild<N extends NodeLikeOf<D>>(parent: ParentNodeLikeOf<D>, child: N, callback?: NodeCallback<N>): void {
    callback?.call(this, child);
    parent.appendChild(child);
  }

  public appendElement(parent: ParentNodeLikeOf<D>, tagName: string, callback?: NodeCallback<ElementOf<D>>): void {
    let element = this.document.createElement(tagName);
    this.appendChild(parent, element, callback);
  }

  public appendTextNode(parent: ParentNodeLikeOf<D>, content: string, callback?: NodeCallback<TextOf<D>>): void {
    let text = this.document.createTextNode(content);
    this.appendChild(parent, text, callback);
  }

  public createDocumentFragment(): DocumentFragmentOf<D> {
    return this.document.createDocumentFragment();
  }

  public createElement(tagName: string): ElementOf<D> {
    return this.document.createElement(tagName);
  }

  public createTextNode(content: string): TextOf<D> {
    return this.document.createTextNode(content);
  }

}


export class DocumentBuilder extends BaseDocumentBuilder<Document> {

}


export class SimpleDocumentBuilder extends BaseDocumentBuilder<SimpleDocument> {

}