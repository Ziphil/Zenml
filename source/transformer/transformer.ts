//

import {
  DocumentFragmentOf,
  DocumentLike,
  ElementOf,
  NodeCallback,
  NodeLikeOf,
  ParentNodeLikeOf,
  TextOf
} from "../builder/type";
import {
  TransformTemplateManager
} from "./template-manager";


export class Transformer<D extends DocumentLike<any, any, any>> {

  public document: D;
  protected readonly implementation: () => D;
  protected readonly templateManager: TransformTemplateManager<D>;
  protected configs: {[key: string]: any};
  protected variables: {[key: string]: any};

  public constructor(implementation: () => D) {
    this.document = implementation();
    this.implementation = implementation;
    this.templateManager = new TransformTemplateManager();
    this.configs = {};
    this.variables = {};
  }

  public updateDocument(document?: D): void {
    this.document = document ?? this.implementation();
  }

  protected resetConfigs(): void {
    this.configs = {};
  }

  protected resetVariables(): void {
    this.variables = {};
  }

  public transform(input: Document, document?: D): D {
    this.updateDocument(document);
    return this.document;
  }

}