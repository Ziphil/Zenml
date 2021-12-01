//

import escapeXml from "xml-escape";
import {
  Fragment
} from "./fragment";
import {
  DocumentLike,
  NodeCallback,
  NodeLike
} from "./type";


export type BaseDocumentOptions = {
  includeDeclaration?: boolean;
};


export abstract class BaseDocument<D extends BaseDocument<D, E>, E extends BaseElement<D, E>> implements DocumentLike<E, string> {

  protected readonly fragment: Fragment<D, E, string>;
  protected readonly options: BaseDocumentOptions;

  public constructor(options?: BaseDocumentOptions) {
    this.fragment = this.createFragment();
    this.options = options ?? {};
  }

  public createFragment(): Fragment<D, E, string> {
    let castThis = this as unknown as D;
    return new Fragment(castThis);
  }

  public abstract createElement(tagName: string): E;

  public createTextNode(content: string): string {
    return content;
  }

  public appendChild<N extends NodeLike<D, E, string>>(child: N, callback?: NodeCallback<N>): N {
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


export abstract class BaseElement<D extends DocumentLike<E, string>, E extends BaseElement<D, E>> {

  public tagName: string;
  protected readonly attributes: Map<string, string>;
  protected readonly fragment: Fragment<D, E, string>;

  public constructor(document: D, tagName: string) {
    this.tagName = tagName;
    this.attributes = new Map();
    this.fragment = new Fragment(document);
  }

  public appendChild<N extends NodeLike<D, E, string>>(child: N, callback?: NodeCallback<N>): N {
    return this.fragment.appendChild(child, callback);
  }

  public appendElement(tagName: string, callback?: NodeCallback<E>): E {
    return this.fragment.appendElement(tagName, callback);
  }

  public appendTextNode(content: string, callback?: NodeCallback<string>): string {
    return this.fragment.appendTextNode(content, callback);
  }

  public getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  public setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  public toString(): string {
    let string = "";
    string += `<${this.tagName}`;
    string += Array.from(this.attributes).map(([name, value]) => ` ${name}="${escapeXml(value)}"`).join("");
    if (this.fragment.nodes.length > 0) {
      string += ">";
      string += this.fragment.nodes.map((child) => (typeof child === "string") ? escapeXml(child) : child.toString()).join("");
      string += `</${this.tagName}>`;
    } else {
      string += "/>";
    }
    return string;
  }

}


export class SimpleDocument extends BaseDocument<SimpleDocument, SimpleElement> {

  public createElement(tagName: string): SimpleElement {
    return new SimpleElement(this, tagName);
  }

}


export class SimpleElement extends BaseElement<SimpleDocument, SimpleElement> {

}