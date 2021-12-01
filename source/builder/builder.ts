//

import {
  CreatableDocument
} from "./document";
import {
  Fragment,
  NodeCallback
} from "./fragment";


export abstract class DocumentBuilder<D extends CreatableDocument<E, T>, E, T> {

  protected document!: D;

  protected buildDocument(rootTagName: string, callback?: NodeCallback<D>): D {
    let self = this.createDocument(rootTagName);
    this.document = self;
    callback?.call(this, self);
    return self;
  }

  protected abstract createDocument(rootTagName: string): D;

  protected createFragment(): Fragment<D, E, T> {
    return new Fragment(this.document);
  }

  protected createElement(tagName: string): E {
    return this.document.createElement(tagName);
  }

  protected createTextNode(content: string): T {
    return this.document.createTextNode(content);
  }

}