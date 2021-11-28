//

import Parsimmon from "parsimmon";
import {
  Parser,
  alt,
  lazy,
  seq
} from "parsimmon";
import {
  DOMImplementation
} from "xmldom";
import "./extension";


const ELEMENT_START = "\\";
const MACRO_START = "&";
const ESCAPE_START = "`";
const ATTRIBUTE_START = "|";
const ATTRIBUTE_END = "|";
const ATTRIBUTE_EQUAL = "=";
const ATTRIBUTE_SEPARATOR = ",";
const STRING_START = "\"";
const STRING_END = "\"";
const CONTENT_START = "<";
const CONTENT_END = ">";
const CONTENT_DELIMITER = ";";
const SPECIAL_ELEMENT_STARTS = {brace: "{", bracket: "[", slash: "/"} as const;
const SPECIAL_ELEMENT_ENDS = {brace: "}", bracket: "]", slash: "/"} as const;
const COMMENT_DELIMITER = "#";
const SYSTEM_INSTRUCTION_NAME = "zml";
const MARK_CHARS = {instruction: "?", trim: "*", verbal: "~", multiple: "+"} as const;
const ESCAPE_CHARS = ["&", "<", ">", "'", "\"", "{", "}", "[", "]", "/", "\\", "|", "`", "#", ";"];
const SPACE_CHARS = ["\u{20}", "\u{9}", "\u{D}", "\u{A}"];
const FIRST_IDENTIFIER_CHAR_RANGES = [
  [0x3A, 0x3A], [0x5F, 0x5F],
  [0x41, 0x5A], [0x61, 0x7A], [0xC0, 0xD6], [0xD8, 0xF6], [0xF8, 0x2FF],
  [0x370, 0x37D], [0x37F, 0x1FFF],
  [0x200C, 0x200D], [0x2070, 0x218F], [0x2C00, 0x2FEF],
  [0x3001, 0xD7FF], [0xF900, 0xFDCF], [0xFDF0, 0xFFFD]
];
const REST_IDENTIFIER_CHAR_RANGES = [
  [0x2D, 0x2E], [0x3A, 0x3A], [0x5F, 0x5F], [0xB7, 0xB7],
  [0x30, 0x39],
  [0x41, 0x5A], [0x61, 0x7A], [0xC0, 0xD6], [0xD8, 0xF6], [0xF8, 0x2FF],
  [0x300, 0x36F],
  [0x370, 0x37D], [0x37F, 0x1FFF],
  [0x200C, 0x200D], [0x2070, 0x218F], [0x2C00, 0x2FEF],
  [0x203F, 0x2040],
  [0x3001, 0xD7FF], [0xF900, 0xFDCF], [0xFDF0, 0xFFFD], [0x10000, 0xEFFFF]
];

const SPACE_CHAR_STRING = SPACE_CHARS.join("");

type ZenmlMark = keyof typeof MARK_CHARS;
type ZenmlAttribute = readonly [name: string, value: string];
type ZenmlAttributes = ReadonlyArray<ZenmlAttribute>;
type ZenmlTagSpec = readonly [name: string, marks: Array<ZenmlMark>, attributes: ZenmlAttributes, macro: boolean];

type Nodes = Array<Node>;


export class BaseZenmlParser {

  private readonly document: Document;

  public constructor() {
    let implementation = new DOMImplementation();
    this.document = implementation.createDocument(null, null, null);
  }

  public tryParse(input: string): Document {
    return this.root.tryParse(input);
  }

  protected root: Parser<Document> = lazy(() => {
    let parser = this.nodes.map((nodes) => {
      let document = this.document;
      for (let node of nodes) {
        document.appendChild(node);
      }
      return document;
    });
    return parser;
  });

  protected nodes: Parser<Nodes> = lazy(() => {
    let innerParsers = [this.element, this.comment, this.text];
    let parser = alt(...innerParsers).many().map((nodesList) => nodesList.flat());
    return parser;
  });

  protected element: Parser<Nodes> = lazy(() => {
    let parser = seq(
      this.tag,
      this.childrenList
    ).mapCatch(([tagSpec, childrenList]) => {
      let [name, marks, attributes, macro] = tagSpec;
      let element = (macro) ? this.processMacro(name, marks, attributes, childrenList) : this.createElement(name, marks, attributes, childrenList);
      return element;
    });
    return parser;
  });

  protected childrenList: Parser<Array<Nodes>> = lazy(() => {
    let parser = alt(this.emptyChildrenChain, this.childrenChain);
    return parser;
  });

  protected childrenChain: Parser<Array<Nodes>> = lazy(() => {
    let parser = this.children.atLeast(1);
    return parser;
  });

  protected emptyChildrenChain: Parser<Array<Nodes>> = lazy(() => {
    let parser = Parsimmon.string(CONTENT_DELIMITER).result([]);
    return parser;
  });

  protected children: Parser<Array<Node>> = lazy(() => {
    let parser = seq(
      Parsimmon.string(CONTENT_START),
      this.nodes,
      Parsimmon.string(CONTENT_END)
    ).map(([, children]) => children);
    return parser;
  });

  protected tag: Parser<ZenmlTagSpec> = lazy(() => {
    let parser = seq(
      Parsimmon.oneOf(ELEMENT_START + MACRO_START),
      this.identifier,
      this.marks,
      this.attributes.maybe()
    ).map(([startChar, name, marks, attributes]) => {
      let macro = startChar === MACRO_START;
      return [name, marks, attributes ?? [], macro] as const;
    });
    return parser;
  });

  protected marks: Parser<Array<ZenmlMark>> = lazy(() => {
    let parser = this.mark.many();
    return parser;
  });

  protected mark: Parser<ZenmlMark> = lazy(() => {
    let parsers = Object.entries(MARK_CHARS).map(([mark, char]) => Parsimmon.string(char).result(mark)) as Array<Parser<ZenmlMark>>;
    let parser = alt(...parsers);
    return parser;
  });

  protected attributes: Parser<ZenmlAttributes> = lazy(() => {
    let parser = seq(
      Parsimmon.string(ATTRIBUTE_START),
      this.attribute.sepBy(seq(this.blank, Parsimmon.string(ATTRIBUTE_SEPARATOR), this.blank)),
      Parsimmon.string(ATTRIBUTE_END)
    ).map(([, attributes]) => attributes);
    return parser;
  });

  protected attribute: Parser<ZenmlAttribute> = lazy(() => {
    let parser = seq(
      this.identifier,
      this.blank,
      this.attributeValue.maybe()
    ).map(([name, , value]) => [name, value ?? name] as const);
    return parser;
  });

  protected attributeValue: Parser<string> = lazy(() => {
    let parser = seq(
      Parsimmon.string(ATTRIBUTE_EQUAL),
      this.blank,
      this.string
    ).map(([, , value]) => value);
    return parser;
  });

  protected string: Parser<string> = lazy(() => {
    let parser = seq(
      Parsimmon.string(STRING_START),
      this.stringFragment.many(),
      Parsimmon.string(STRING_END)
    ).map(([, strings]) => strings.join());
    return parser;
  });

  protected stringFragment: Parser<string> = lazy(() => {
    let parser = alt(this.stringEscape, this.plainStringFragment);
    return parser;
  });

  protected plainStringFragment: Parser<string> = lazy(() => {
    let parser = Parsimmon.noneOf(STRING_START + STRING_END).atLeast(1).map((chars) => chars.join(""));
    return parser;
  });

  protected identifier: Parser<string> = lazy(() => {
    let parser = seq(
      this.firstIdentifierChar,
      this.restIdentifierChar.many()
    ).map(([firstChar, restChars]) => firstChar + restChars.join(""));
    return parser;
  });

  protected firstIdentifierChar: Parser<string> = lazy(() => {
    let parser = Parsimmon.test((char) => {
      let code = char.charCodeAt(0);
      let predicate = FIRST_IDENTIFIER_CHAR_RANGES.some(([start, end]) => code >= start && code <= end);
      return predicate;
    });
    return parser;
  });

  protected restIdentifierChar: Parser<string> = lazy(() => {
    let parser = Parsimmon.test((char) => {
      let code = char.charCodeAt(0);
      let predicate = REST_IDENTIFIER_CHAR_RANGES.some(([start, end]) => code >= start && code <= end);
      return predicate;
    });
    return parser;
  });

  protected text: Parser<Nodes> = lazy(() => {
    let parser = this.textContentFragment.atLeast(1).mapCatch((contents) => this.createText(contents.join("")));
    return parser;
  });

  protected textContentFragment: Parser<string> = lazy(() => {
    let parser = alt(this.textEscape, this.plainTextContentFragment);
    return parser;
  });

  protected plainTextContentFragment: Parser<string> = lazy(() => {
    let exclusion = ELEMENT_START + MACRO_START + ESCAPE_START + CONTENT_START + CONTENT_END + CONTENT_DELIMITER + COMMENT_DELIMITER;
    for (let [, char] of Object.entries(SPECIAL_ELEMENT_STARTS)) {
      exclusion += char;
    }
    for (let [, char] of Object.entries(SPECIAL_ELEMENT_ENDS)) {
      exclusion += char;
    }
    let parser = Parsimmon.noneOf(exclusion).atLeast(1).map((chars) => chars.join(""));
    return parser;
  });

  protected stringEscape: Parser<string> = lazy(() => {
    let parser = seq(
      Parsimmon.string(ESCAPE_START),
      Parsimmon.any
    ).mapCatch(([, char]) => this.createStringEscape(char));
    return parser;
  });

  protected textEscape: Parser<string> = lazy(() => {
    let parser = seq(
      Parsimmon.string(ESCAPE_START),
      Parsimmon.any
    ).mapCatch(([, char]) => this.createTextEscape(char));
    return parser;
  });

  protected comment: Parser<Nodes> = lazy(() => {
    let parser = seq(
      Parsimmon.string(COMMENT_DELIMITER),
      alt(this.lineComment, this.blockComment)
    ).map(([, comment]) => comment);
    return parser;
  });

  protected lineComment: Parser<Nodes> = lazy(() => {
    let parser = seq(
      Parsimmon.string(COMMENT_DELIMITER),
      this.lineCommentContent,
      alt(Parsimmon.string("\n"), Parsimmon.eof)
    ).map(([, content]) => this.createLineComment(content));
    return parser;
  });

  protected blockComment: Parser<Nodes> = lazy(() => {
    let parser = seq(
      Parsimmon.string(CONTENT_START),
      this.blockCommentContent,
      Parsimmon.string(CONTENT_END)
    ).map(([, content]) => this.createBlockComment(content));
    return parser;
  });

  protected lineCommentContent: Parser<string> = lazy(() => {
    let parser = Parsimmon.noneOf("\n").many().map((chars) => chars.join(""));
    return parser;
  });

  protected blockCommentContent: Parser<string> = lazy(() => {
    let parser = Parsimmon.noneOf(CONTENT_END).many().map((chars) => chars.join(""));
    return parser;
  });

  protected blank: Parser<null> = lazy(() => {
    let parser = Parsimmon.oneOf(SPACE_CHAR_STRING).many().result(null);
    return parser;
  });

  protected createElement(name: string, marks: Array<ZenmlMark>, attributes: ZenmlAttributes, childrenList: Array<Nodes>): Nodes {
    if (childrenList.length <= 1 || marks.includes("multiple")) {
      return this.createNormalElement(name, attributes, childrenList);
    } else {
      throw "normal element cannot have more than one argument";
    }
  }

  protected createNormalElement(name: string, attributes: ZenmlAttributes, childrenList: Array<Nodes>): Nodes {
    let nodes = [];
    for (let children of childrenList) {
      let element = this.document.createElement(name);
      for (let attribute of attributes) {
        element.setAttribute(attribute[0], attribute[1]);
      }
      for (let child of children) {
        element.appendChild(child);
      }
      nodes.push(element);
    }
    return nodes;
  }

  protected createText(content: string): Nodes {
    let text = this.document.createTextNode(content);
    return [text];
  }

  protected createLineComment(content: string): Nodes {
    let comment = this.document.createComment(content);
    return [comment];
  }

  protected createBlockComment(content: string): Nodes {
    let comment = this.document.createComment(content);
    return [comment];
  }

  protected processMacro(name: string, marks: Array<ZenmlMark>, attributes: ZenmlAttributes, childrenList: Array<Nodes>): Nodes {
    throw "to be implemented";
  }

  protected createStringEscape(char: string): string {
    if (ESCAPE_CHARS.includes(char)) {
      return char;
    } else {
      throw "invalid escape";
    }
  }

  protected createTextEscape(char: string): string {
    if (ESCAPE_CHARS.includes(char)) {
      return char;
    } else {
      throw "invalid escape";
    }
  }

}