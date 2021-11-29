//

import Parsimmon from "parsimmon";
import {
  Parser,
  alt,
  lazy,
  seq
} from "parsimmon";
import "./extension";
import {
  DOMImplementation,
  dedentChildren
} from "../dom";
import {
  create
} from "./util";


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
type ZenmlSpecialElementKind = keyof typeof SPECIAL_ELEMENT_STARTS;
type ZenmlAttribute = readonly [name: string, value: string];
type ZenmlAttributes = ReadonlyArray<ZenmlAttribute>;
type ZenmlTagSpec = readonly [name: string, marks: Array<ZenmlMark>, attributes: ZenmlAttributes, macro: boolean];

export type Nodes = Array<Node>;
type ParserWithState<T> = (state: BaseZenmlParserState) => Parser<T>;

type BaseZenmlParserState = {
  verbal?: boolean,
  inSlash?: boolean
};
export type BaseZenmlParserOptions = {
  document?: Document,
  specialElementNames?: {brace?: string, bracket?: string, slash?: string};
};


export class BaseZenmlParser {

  private readonly document: Document;
  private readonly options: BaseZenmlParserOptions;

  public constructor(options?: BaseZenmlParserOptions) {
    let implementation = new DOMImplementation();
    this.document = options?.document ?? implementation.createDocument(null, null, null);
    this.options = options ?? {};
  }

  public tryParse(input: string): Document {
    return this.root.tryParse(input);
  }

  protected root: Parser<Document> = lazy(() => {
    let parser = this.nodes({}).map((nodes) => {
      let document = this.document;
      for (let node of nodes) {
        document.appendChild(node);
      }
      return document;
    });
    return parser;
  });

  protected nodes: ParserWithState<Nodes> = create((state) => {
    if (state.verbal) {
      let parser = this.verbalText;
      return parser;
    } else {
      let innerParsers = [];
      innerParsers.push(lazy(() => this.element(state)));
      innerParsers.push(lazy(() => this.braceElement(state)), lazy(() => this.bracketElement(state)));
      if (!state.inSlash) {
        innerParsers.push(lazy(() => this.slashElement(state)));
      }
      innerParsers.push(this.comment, this.text);
      let parser = alt(...innerParsers).many().map((nodesList) => nodesList.flat());
      return parser;
    }
  });

  protected element: ParserWithState<Nodes> = create((state) => {
    let parser = seq(
      this.tag
    ).chain(([tagSpec]) => {
      let [name, marks, attributes, macro] = tagSpec;
      let nextState = {...state, inSlash: false};
      if (marks.includes("verbal")) {
        nextState = {...nextState, verbal: true};
      }
      let nextParser = this.childrenList(nextState).map((childrenList) => [tagSpec, childrenList] as const);
      return nextParser;
    }).map(([tagSpec, childrenList]) => {
      let [name, marks, attributes, macro] = tagSpec;
      if (marks.includes("trim")) {
        for (let children of childrenList) {
          dedentChildren(children);
        }
      }
      let element = this.createElement(name, marks, attributes, childrenList);
      return element;
    });
    return parser;
  });

  protected braceElement: ParserWithState<Nodes> = create((state) => {
    let parser = seq(
      Parsimmon.string(SPECIAL_ELEMENT_STARTS.brace),
      this.nodes(state),
      Parsimmon.string(SPECIAL_ELEMENT_ENDS.brace)
    ).mapCatch(([, children]) => {
      let element = this.createSpecialElement("brace", children);
      return element;
    });
    return parser;
  });

  protected bracketElement: ParserWithState<Nodes> = create((state) => {
    let parser = seq(
      Parsimmon.string(SPECIAL_ELEMENT_STARTS.bracket),
      this.nodes(state),
      Parsimmon.string(SPECIAL_ELEMENT_ENDS.bracket)
    ).mapCatch(([, children]) => {
      let element = this.createSpecialElement("bracket", children);
      return element;
    });
    return parser;
  });

  protected slashElement: ParserWithState<Nodes> = create((state) => {
    let parser = seq(
      Parsimmon.string(SPECIAL_ELEMENT_STARTS.slash),
      this.nodes({...state, inSlash: true}),
      Parsimmon.string(SPECIAL_ELEMENT_ENDS.slash)
    ).mapCatch(([, children]) => {
      let element = this.createSpecialElement("slash", children);
      return element;
    });
    return parser;
  });

  protected childrenList: ParserWithState<Array<Nodes>> = create((state) => {
    let parser = alt(this.emptyChildrenChain, this.childrenChain(state));
    return parser;
  });

  protected childrenChain: ParserWithState<Array<Nodes>> = create((state) => {
    let parser = this.children(state).atLeast(1);
    return parser;
  });

  protected emptyChildrenChain: Parser<Array<Nodes>> = lazy(() => {
    let parser = Parsimmon.string(CONTENT_DELIMITER).result([]);
    return parser;
  });

  protected children: ParserWithState<Array<Node>> = create((state) => {
    let parser = seq(
      Parsimmon.string(CONTENT_START),
      this.nodes(state),
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
    ).map(([, strings]) => strings.join(""));
    return parser;
  });

  protected stringFragment: Parser<string> = lazy(() => {
    let parser = alt(this.stringEscape, this.plainStringFragment);
    return parser;
  });

  protected plainStringFragment: Parser<string> = lazy(() => {
    let parser = Parsimmon.noneOf(STRING_START + STRING_END + ESCAPE_START).atLeast(1).map((chars) => chars.join(""));
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

  protected verbalText: Parser<Nodes> = lazy(() => {
    let parser = this.verbalTextContentFragment.atLeast(1).mapCatch((contents) => this.createText(contents.join("")));
    return parser;
  });

  protected textContentFragment: Parser<string> = lazy(() => {
    let parser = alt(this.textEscape, this.plainTextContentFragment);
    return parser;
  });

  protected verbalTextContentFragment: Parser<string> = lazy(() => {
    let parser = alt(this.textEscape, this.plainVerbalTextContentFragment);
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

  protected plainVerbalTextContentFragment: Parser<string> = lazy(() => {
    let exclusion = ESCAPE_START + CONTENT_END;
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
    if (marks.includes("instruction")) {
      return this.createInstruction(name, marks, attributes, childrenList);
    } else {
      return this.createNormalElement(name, marks, attributes, childrenList);
    }
  }

  protected createInstruction(name: string, marks: Array<ZenmlMark>, attributes: ZenmlAttributes, childrenList: Array<Nodes>): Nodes {
    if (name === SYSTEM_INSTRUCTION_NAME) {
      if (childrenList.length <= 0) {
        return [];
      } else {
        throw "ZenML declaration cannot have arguments";
      }
    } else {
      if (childrenList.length <= 1) {
        let children = childrenList[0] ?? [];
        let contents = [];
        for (let attribute of attributes) {
          contents.push(`${attribute[0]}="${attribute[1]}"`);
        }
        for (let child of children) {
          if (child.nodeType === 3) {
            let text = child as Text;
            contents.push(text.data);
          } else {
            throw "Contents of a processing instruction must be texts";
          }
        }
        let content = contents.join(" ");
        let instruction = this.document.createProcessingInstruction(name, content);
        return [instruction];
      } else {
        throw "Processing instruction cannot have more than one argument";
      }
    }
  }

  protected createNormalElement(name: string, marks: Array<ZenmlMark>, attributes: ZenmlAttributes, childrenList: Array<Nodes>): Nodes {
    let nodes = [];
    if (childrenList.length <= 0) {
      childrenList = [[]];
    }
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

  protected createSpecialElement(kind: ZenmlSpecialElementKind, children: Nodes): Nodes {
    let name = this.options.specialElementNames?.[kind];
    if (name !== undefined) {
      let nodes = this.createNormalElement(name, [], [], [children]);
      return nodes;
    } else {
      throw `No name specified for ${kind} elements`;
    }
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

  protected createStringEscape(char: string): string {
    if (ESCAPE_CHARS.includes(char)) {
      return char;
    } else {
      throw "Invalid escape";
    }
  }

  protected createTextEscape(char: string): string {
    if (ESCAPE_CHARS.includes(char)) {
      return char;
    } else {
      throw "Invalid escape";
    }
  }

}