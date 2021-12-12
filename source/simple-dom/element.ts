//

import escapeXml from "xml-escape";
import {
  NodeCallback,
  NodeLike
} from "../type/dom";
import type {
  BaseDocument,
  SimpleDocument
} from "./document";
import type {
  BaseDocumentFragment,
  SimpleDocumentFragment
} from "./document-fragment";


const VOID_TAG_NAMES = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"];


export abstract class BaseElement<D extends BaseDocument<D, F, E>, F extends BaseDocumentFragment<D, F, E>, E extends BaseElement<D, F, E>> {

  protected readonly document: D;
  public tagName: string;
  protected readonly attributes: Map<string, string>;
  protected readonly fragment: F;

  public constructor(document: D, tagName: string) {
    this.document = document;
    this.tagName = tagName;
    this.attributes = new Map();
    this.fragment = document.createDocumentFragment();
  }

  public appendChild<N extends NodeLike<F, E, string>>(child: N, callback?: NodeCallback<N>): N {
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
    if (this.document.options.html) {
      string += `<${this.tagName}`;
      string += Array.from(this.attributes).map(([name, value]) => ` ${name}="${escapeXml(value)}"`).join("");
      string += ">";
      if (!VOID_TAG_NAMES.includes(this.tagName)) {
        string += this.fragment.nodes.map((child) => (typeof child === "string") ? escapeXml(child) : child.toString()).join("");
        string += `</${this.tagName}>`;
      }
    } else {
      string += `<${this.tagName}`;
      string += Array.from(this.attributes).map(([name, value]) => ` ${name}="${escapeXml(value)}"`).join("");
      if (this.fragment.nodes.length > 0) {
        string += ">";
        string += this.fragment.nodes.map((child) => (typeof child === "string") ? escapeXml(child) : child.toString()).join("");
        string += `</${this.tagName}>`;
      } else {
        string += "/>";
      }
    }
    return string;
  }

}


export class SimpleElement extends BaseElement<SimpleDocument, SimpleDocumentFragment, SimpleElement> {

}