//


export type ZenmlSerializerOptions = {
};


export class ZenmlSerializer {

  public readonly options: ZenmlSerializerOptions;

  public constructor(options?: ZenmlSerializerOptions) {
    this.options = options ?? {};
  }

  public serialize(node: Node): string {
    const nodeType = node.nodeType;
    if (nodeType === 1) {
      return this.serializeElement(node as Element);
    } else if (nodeType === 2) {
      return this.serializeAttribute(node as Attr);
    } else if (nodeType === 3) {
      return this.serializeText(node as Text);
    } else if (nodeType === 4) {
      return this.serializeText(node as CDATASection);
    } else if (nodeType === 7) {
      return this.serializeProcessingInstruction(node as ProcessingInstruction);
    } else if (nodeType === 8) {
      return this.serializeComment(node as Comment);
    } else if (nodeType === 9) {
      return this.serializeDocument(node as Document);
    } else if (nodeType === 11) {
      return this.serializeDocumentFragment(node as DocumentFragment);
    } else {
      return "";
    }
  }

  private serializeElement(element: Element): string {
    let output = "";
    const tagName = element.tagName;
    const attributes = Array.from(element.attributes);
    const children = Array.from(element.childNodes);
    output += `\\${tagName}`;
    if (attributes.length > 0) {
      output += "|" + attributes.map((attribute) => this.serializeAttribute(attribute)).join(",") + "|";
    }
    if (children.length > 0) {
      output += "<" + children.map((child) => this.serialize(child)).join("") + ">";
    } else {
      output += ";";
    }
    return output;
  }

  private serializeAttribute(attribute: Attr): string {
    return `${attribute.name}="${this.escapeString(attribute.value)}"`;
  }

  private serializeText(text: Text): string {
    return this.escapeText(text.data ?? "");
  }

  private serializeProcessingInstruction(instruction: ProcessingInstruction): string {
    let output = "";
    const tagName = instruction.target;
    const data = instruction.data;
    output += `\\${tagName}?`;
    if (data !== "") {
      output += "<" + this.escapeText(data) + ">";
    } else {
      output += ";";
    }
    return output;
  }

  private serializeDocument(document: Document): string {
    return Array.from(document.childNodes).map((child) => this.serialize(child)).join("");
  }

  private serializeDocumentFragment(fragment: DocumentFragment): string {
    let output = "";
    const children = Array.from(fragment.childNodes);
    if (children.length > 0) {
      output += children.map((child) => this.serialize(child)).join("");
    } else {
      output += "";
    }
    return output;
  }

  private serializeComment(comment: Comment): string {
    return "#<" + (comment.data ?? "").replace(/>/g, "") + ">";
  }

  private escapeString(string: string): string {
    return string.replace(/["`]/g, (char) => `\`${char}`);
  }

  private escapeText(string: string): string {
    return string.replace(/[\\&`<>;#{}\[\]/]/g, (char) => `\`${char}`);
  }

}