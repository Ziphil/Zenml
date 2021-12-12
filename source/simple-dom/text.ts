//

import escapeXml from "xml-escape";
import type {
  BaseDocument,
  SimpleDocument
} from "./document";
import type {
  BaseDocumentFragment,
  SimpleDocumentFragment
} from "./document-fragment";
import type {
  BaseElement,
  SimpleElement
} from "./element";


export class BaseText<D extends BaseDocument<D, F, E, T>, F extends BaseDocumentFragment<D, F, E, T>, E extends BaseElement<D, F, E, T>, T extends BaseText<D, F, E, T>> {

  protected readonly document: D;
  public content: string;

  public constructor(document: D, content: string) {
    this.document = document;
    this.content = content;
  }

  public toString(): string {
    return escapeXml(this.content);
  }

}


export class SimpleText extends BaseText<SimpleDocument, SimpleDocumentFragment, SimpleElement, SimpleText> {

}