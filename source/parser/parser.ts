//

import Parsimmon from "parsimmon";
import {
  Parser,
  alt,
  lazy,
  seq
} from "parsimmon";
import {
  dedentDescendants,
  isText
} from "../util/dom";
import {
  ZenmlPlugin
} from "./plugin";
import {
  StateParser,
  create,
  mapCatch,
  maybe
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

export type ZenmlMark = keyof typeof MARK_CHARS;
export type ZenmlMarks = ReadonlyArray<ZenmlMark>;
export type ZenmlSpecialElementKind = keyof typeof SPECIAL_ELEMENT_STARTS;
export type ZenmlAttribute = readonly [name: string, value: string];
export type ZenmlAttributes = Map<string, string>;
export type ZenmlTagSpec = readonly [name: string, marks: ZenmlMarks, attributes: ZenmlAttributes, macro: boolean];

export type Nodes = Array<Node>;

type ZenmlParserState = {
  verbal?: boolean,
  inSlash?: boolean,
  pluginName?: string
};
export type ZenmlParserOptions = {
  document?: Document,
  specialElementNames?: {brace?: string, bracket?: string, slash?: string}
};


export class ZenmlParser {

  public document: Document;
  private readonly implementation: DOMImplementation;
  private readonly plugins: Map<string, ZenmlPlugin>;
  private readonly options: ZenmlParserOptions;

  public constructor(implementation: DOMImplementation, options?: ZenmlParserOptions) {
    let document = options?.document ?? implementation.createDocument(null, null, null);
    this.document = document;
    this.implementation = implementation;
    this.plugins = new Map();
    this.options = options ?? {};
  }

  public registerPlugin(name: string, plugin: ZenmlPlugin): void {
    this.plugins.set(name, plugin);
    plugin.initialize(this);
  }

  public updateDocument(): void {
    let document = this.options.document ?? this.implementation.createDocument(null, null, null);
    this.document = document;
  }

  public tryParse(input: string): Document {
    this.updateDocument();
    return this.root.tryParse(input);
  }

  public readonly root: Parser<Document> = lazy(() => {
    let parser = this.nodes({}).map((nodes) => {
      let document = this.document;
      for (let node of nodes) {
        document.appendChild(node);
      }
      return document;
    });
    return parser;
  });

  public readonly nodes: StateParser<Nodes, ZenmlParserState> = create((state) => {
    if (state.pluginName !== undefined) {
      let plugin = this.plugins.get(state.pluginName);
      if (plugin !== undefined) {
        let parser = plugin.getParser();
        return parser;
      } else {
        return Parsimmon.fail("No such plugin");
      }
    } else if (state.verbal) {
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

  public readonly element: StateParser<Nodes, ZenmlParserState> = create((state) => {
    let parser = seq(
      this.tag
    ).chain(([tagSpec]) => {
      let [name, marks, attributes, macro] = tagSpec;
      let nextState = this.determineNextState(state, name, marks, attributes, macro);
      let nextParser = this.determineNextParser(nextState, name, marks, attributes, macro);
      return nextParser;
    }).thru(mapCatch(([tagSpec, childrenList]) => {
      let [name, marks, attributes, macro] = tagSpec;
      this.modifyChildrenList(name, marks, attributes, macro, childrenList);
      if (macro) {
        return this.processMacro(name, marks, attributes, childrenList);
      } else {
        return this.createElement(name, marks, attributes, childrenList);
      }
    }));
    return parser;
  });

  private determineNextState(state: ZenmlParserState, name: string, marks: ZenmlMarks, attributes: ZenmlAttributes, macro: boolean): ZenmlParserState {
    let nextState = {...state, inSlash: false};
    if (marks.includes("verbal")) {
      nextState = {...nextState, verbal: true};
    }
    if (macro) {
      nextState = {...nextState, pluginName: name};
    }
    return nextState;
  }

  private determineNextParser(nextState: ZenmlParserState, name: string, marks: ZenmlMarks, attributes: ZenmlAttributes, macro: boolean): Parser<readonly [ZenmlTagSpec, Array<Nodes>]> {
    let nextParser = seq(
      this.childrenList(nextState),
      (name === SYSTEM_INSTRUCTION_NAME && marks.includes("instruction")) ? this.blank : Parsimmon.succeed(null)
    ).map(([childrenList]) => {
      let tagSpec = [name, marks, attributes, macro] as const;
      let result = [tagSpec, childrenList] as const;
      return result;
    });
    return nextParser;
  }

  private modifyChildrenList(name: string, marks: ZenmlMarks, attributes: ZenmlAttributes, macro: boolean, childrenList: Array<Nodes>): void {
    if (childrenList.length >= 2 && !macro && !marks.includes("multiple")) {
      throw "Normal element cannot have more than one argument";
    }
    if (marks.includes("trim")) {
      for (let children of childrenList) {
        dedentDescendants(children);
      }
    }
  }

  private processMacro(name: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenList: Array<Nodes>): Nodes {
    let plugin = this.plugins.get(name);
    if (plugin !== undefined) {
      let element = plugin.createElement(name, marks, attributes, childrenList);
      return element;
    } else {
      throw "No such plugin";
    }
  }

  public readonly braceElement: StateParser<Nodes, ZenmlParserState> = create((state) => {
    let parser = seq(
      Parsimmon.string(SPECIAL_ELEMENT_STARTS.brace),
      this.nodes(state),
      Parsimmon.string(SPECIAL_ELEMENT_ENDS.brace)
    ).thru(mapCatch(([, children]) => {
      let element = this.createSpecialElement("brace", children);
      return element;
    }));
    return parser;
  });

  public readonly bracketElement: StateParser<Nodes, ZenmlParserState> = create((state) => {
    let parser = seq(
      Parsimmon.string(SPECIAL_ELEMENT_STARTS.bracket),
      this.nodes(state),
      Parsimmon.string(SPECIAL_ELEMENT_ENDS.bracket)
    ).thru(mapCatch(([, children]) => {
      let element = this.createSpecialElement("bracket", children);
      return element;
    }));
    return parser;
  });

  public readonly slashElement: StateParser<Nodes, ZenmlParserState> = create((state) => {
    let parser = seq(
      Parsimmon.string(SPECIAL_ELEMENT_STARTS.slash),
      this.nodes({...state, inSlash: true}),
      Parsimmon.string(SPECIAL_ELEMENT_ENDS.slash)
    ).thru(mapCatch(([, children]) => {
      let element = this.createSpecialElement("slash", children);
      return element;
    }));
    return parser;
  });

  public readonly childrenList: StateParser<Array<Nodes>, ZenmlParserState> = create((state) => {
    let parser = alt(this.emptyChildrenChain, this.childrenChain(state));
    return parser;
  });

  public readonly childrenChain: StateParser<Array<Nodes>, ZenmlParserState> = create((state) => {
    let parser = this.children(state).atLeast(1);
    return parser;
  });

  public readonly emptyChildrenChain: Parser<Array<Nodes>> = lazy(() => {
    let parser = Parsimmon.string(CONTENT_DELIMITER).result([]);
    return parser;
  });

  public readonly children: StateParser<Array<Node>, ZenmlParserState> = create((state) => {
    let parser = seq(
      Parsimmon.string(CONTENT_START),
      this.nodes(state),
      Parsimmon.string(CONTENT_END)
    ).map(([, children]) => children);
    return parser;
  });

  public readonly tag: Parser<ZenmlTagSpec> = lazy(() => {
    let parser = seq(
      Parsimmon.oneOf(ELEMENT_START + MACRO_START),
      this.identifier,
      this.marks,
      this.attributes.thru(maybe)
    ).map(([startChar, name, marks, rawAttributes]) => {
      let macro = startChar === MACRO_START;
      let attributes = rawAttributes ?? new Map();
      return [name, marks, attributes, macro] as const;
    });
    return parser;
  });

  public readonly marks: Parser<ZenmlMarks> = lazy(() => {
    let parser = this.mark.many();
    return parser;
  });

  public readonly mark: Parser<ZenmlMark> = lazy(() => {
    let parsers = Object.entries(MARK_CHARS).map(([mark, char]) => Parsimmon.string(char).result(mark)) as Array<Parser<ZenmlMark>>;
    let parser = alt(...parsers);
    return parser;
  });

  public readonly attributes: Parser<ZenmlAttributes> = lazy(() => {
    let parser = seq(
      Parsimmon.string(ATTRIBUTE_START),
      this.attribute.sepBy(seq(this.blank, Parsimmon.string(ATTRIBUTE_SEPARATOR), this.blank)),
      Parsimmon.string(ATTRIBUTE_END)
    ).map(([, rawAttributes]) => {
      let attributes = new Map<string, string>();
      for (let [name, value] of rawAttributes) {
        attributes.set(name, value);
      }
      return attributes;
    });
    return parser;
  });

  public readonly attribute: Parser<ZenmlAttribute> = lazy(() => {
    let parser = seq(
      this.identifier,
      this.blank,
      this.attributeValue.thru(maybe)
    ).map(([name, , rawValue]) => {
      let value = rawValue ?? name;
      return [name, value] as const;
    });
    return parser;
  });

  public readonly attributeValue: Parser<string> = lazy(() => {
    let parser = seq(
      Parsimmon.string(ATTRIBUTE_EQUAL),
      this.blank,
      this.string
    ).map(([, , value]) => value);
    return parser;
  });

  public readonly string: Parser<string> = lazy(() => {
    let parser = seq(
      Parsimmon.string(STRING_START),
      this.stringFragment.many(),
      Parsimmon.string(STRING_END)
    ).map(([, strings]) => strings.join(""));
    return parser;
  });

  public readonly stringFragment: Parser<string> = lazy(() => {
    let parser = alt(this.stringEscape, this.plainStringFragment);
    return parser;
  });

  public readonly plainStringFragment: Parser<string> = lazy(() => {
    let parser = Parsimmon.noneOf(STRING_START + STRING_END + ESCAPE_START).atLeast(1).map((chars) => chars.join(""));
    return parser;
  });

  public readonly identifier: Parser<string> = lazy(() => {
    let parser = seq(
      this.firstIdentifierChar,
      this.restIdentifierChar.many()
    ).map(([firstChar, restChars]) => firstChar + restChars.join(""));
    return parser;
  });

  public readonly firstIdentifierChar: Parser<string> = lazy(() => {
    let parser = Parsimmon.test((char) => {
      let code = char.charCodeAt(0);
      let predicate = FIRST_IDENTIFIER_CHAR_RANGES.some(([start, end]) => code >= start && code <= end);
      return predicate;
    });
    return parser;
  });

  public readonly restIdentifierChar: Parser<string> = lazy(() => {
    let parser = Parsimmon.test((char) => {
      let code = char.charCodeAt(0);
      let predicate = REST_IDENTIFIER_CHAR_RANGES.some(([start, end]) => code >= start && code <= end);
      return predicate;
    });
    return parser;
  });

  public readonly text: Parser<Nodes> = lazy(() => {
    let parser = this.textContentFragment.atLeast(1).thru(mapCatch((contents) => {
      let content = contents.join("");
      return this.createText(content);
    }));
    return parser;
  });

  public readonly verbalText: Parser<Nodes> = lazy(() => {
    let parser = this.verbalTextContentFragment.atLeast(1).thru(mapCatch((contents) => {
      let content = contents.join("");
      return this.createText(content);
    }));
    return parser;
  });

  public readonly textContentFragment: Parser<string> = lazy(() => {
    let parser = alt(this.textEscape, this.plainTextContentFragment);
    return parser;
  });

  public readonly verbalTextContentFragment: Parser<string> = lazy(() => {
    let parser = alt(this.textEscape, this.plainVerbalTextContentFragment);
    return parser;
  });

  public readonly plainTextContentFragment: Parser<string> = lazy(() => {
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

  public readonly plainVerbalTextContentFragment: Parser<string> = lazy(() => {
    let exclusion = ESCAPE_START + CONTENT_END;
    let parser = Parsimmon.noneOf(exclusion).atLeast(1).map((chars) => chars.join(""));
    return parser;
  });

  public readonly stringEscape: Parser<string> = lazy(() => {
    let parser = seq(
      Parsimmon.string(ESCAPE_START),
      Parsimmon.any
    ).thru(mapCatch(([, char]) => this.createStringEscape(char)));
    return parser;
  });

  public readonly textEscape: Parser<string> = lazy(() => {
    let parser = seq(
      Parsimmon.string(ESCAPE_START),
      Parsimmon.any
    ).thru(mapCatch(([, char]) => this.createTextEscape(char)));
    return parser;
  });

  public readonly comment: Parser<Nodes> = lazy(() => {
    let parser = seq(
      Parsimmon.string(COMMENT_DELIMITER),
      alt(this.lineComment, this.blockComment)
    ).map(([, comment]) => comment);
    return parser;
  });

  public readonly lineComment: Parser<Nodes> = lazy(() => {
    let parser = seq(
      Parsimmon.string(COMMENT_DELIMITER),
      this.lineCommentContent,
      alt(Parsimmon.string("\n"), Parsimmon.eof)
    ).map(([, content]) => this.createLineComment(content));
    return parser;
  });

  public readonly blockComment: Parser<Nodes> = lazy(() => {
    let parser = seq(
      Parsimmon.string(CONTENT_START),
      this.blockCommentContent,
      Parsimmon.string(CONTENT_END)
    ).map(([, content]) => this.createBlockComment(content));
    return parser;
  });

  public readonly lineCommentContent: Parser<string> = lazy(() => {
    let parser = Parsimmon.noneOf("\n").many().map((chars) => chars.join(""));
    return parser;
  });

  public readonly blockCommentContent: Parser<string> = lazy(() => {
    let parser = Parsimmon.noneOf(CONTENT_END).many().map((chars) => chars.join(""));
    return parser;
  });

  public readonly blank: Parser<null> = lazy(() => {
    let parser = Parsimmon.oneOf(SPACE_CHAR_STRING).many().result(null);
    return parser;
  });

  protected createElement(name: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenList: Array<Nodes>): Nodes {
    if (marks.includes("instruction")) {
      return this.createInstruction(name, marks, attributes, childrenList);
    } else {
      return this.createNormalElement(name, marks, attributes, childrenList);
    }
  }

  protected createInstruction(name: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenList: Array<Nodes>): Nodes {
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
        for (let [attributeName, attributeValue] of attributes) {
          contents.push(`${attributeName}="${attributeValue}"`);
        }
        for (let child of children) {
          if (isText(child)) {
            contents.push(child.data);
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

  protected createNormalElement(name: string, marks: ZenmlMarks, attributes: ZenmlAttributes, childrenList: Array<Nodes>): Nodes {
    let nodes = [];
    if (childrenList.length <= 0) {
      childrenList = [[]];
    }
    for (let children of childrenList) {
      let element = this.document.createElement(name);
      for (let [attributeName, attributeValue] of attributes) {
        element.setAttribute(attributeName, attributeValue);
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
      let nodes = this.createNormalElement(name, [], new Map(), [children]);
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