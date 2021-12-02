//


export class Transformer<D, F, E, T> {

  public document: D;
  private readonly documentCreator: () => D;

  public constructor(documentCreator: () => D) {
    this.document = documentCreator();
    this.documentCreator = documentCreator;
  }

  public updateDocument(document?: D): void {
    this.document = document ?? this.documentCreator();
  }

  public transform(input: Document, document?: D): D {
    this.updateDocument(document);
    return this.document;
  }

}