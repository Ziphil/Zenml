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


export abstract class BaseSimpleDocument<D extends BaseSimpleDocument<D, E>, E extends BaseSimpleElement<D, E>> implements DocumentLike<E, string> {

  public readonly documentElement: E;

  public constructor(rootTagName: string) {
    this.documentElement = this.createElement(rootTagName);
  }

  public createFragment(): Fragment<D, E, string> {
    let castThis = this as unknown as D;
    return new Fragment(castThis);
  }

  public abstract createElement(tagName: string): E;

  public createTextNode(content: string): string {
    return content;
  }

  public appendChild<N extends NodeLike<D, E, string>>(node: N, callback?: NodeCallback<N>): N {
    return this.documentElement.appendChild(node, callback);
  }

  public appendElement(tagName: string, callback?: NodeCallback<E>): E {
    return this.documentElement.appendElement(tagName, callback);
  }

  public getAttribute(name: string): string | null {
    return this.documentElement.getAttribute(name);
  }

  public setAttribute(name: string, value: string): void {
    this.documentElement.setAttribute(name, value);
  }

  public toString(): string {
    let string = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
    string += this.documentElement.toString();
    return string;
  }

}


export class BaseSimpleElement<D extends DocumentLike<E, string>, E extends BaseSimpleElement<D, E>> {

  public tagName: string;
  private attributes: Map<string, string>;
  private fragment: Fragment<D, E, string>;

  public constructor(document: D, tagName: string) {
    this.tagName = tagName;
    this.attributes = new Map();
    this.fragment = new Fragment(document);
  }

  public appendChild<N extends NodeLike<D, E, string>>(node: N, callback?: NodeCallback<N>): N {
    return this.fragment.appendChild(node, callback);
  }

  public appendElement(tagName: string, callback?: NodeCallback<E>): E {
    return this.fragment.appendElement(tagName, callback);
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


export class SimpleDocument extends BaseSimpleDocument<SimpleDocument, SimpleElement> {

  public createElement(tagName: string): SimpleElement {
    return new SimpleElement(this, tagName);
  }

}


export class SimpleElement extends BaseSimpleElement<SimpleDocument, SimpleElement> {

}