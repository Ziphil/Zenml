//


export abstract class DocumentBuilder<D extends CreatableDocument<E, T>, E, T> {

  protected document!: D;

  protected buildDocument(name: string, callback?: NodeCallback<D>): D {
    let self = this.createDocument(name);
    this.document = self;
    callback?.call(this, self);
    return self;
  }

  protected abstract createDocument(name: string): D;

  protected createElement(name: string): E {
    return this.document.createElement(name);
  }

  protected createTextNode(content: string): T {
    return this.document.createTextNode(content);
  }

}


export interface CreatableDocument<E, T> {

  createElement(name: string): E;

  createTextNode(content: string): T;

}


export type NodeCallback<N> = (node: N) => void;