//

import Parsimmon from "parsimmon";
import {
  Parser,
  lookahead
} from "parsimmon";


export function attempt<T>(parser: Parser<T>): Parser<T> {
  return lookahead(parser).then(parser);
}

export function mapCatch<T, U>(callback: (result: T) => U): (parser: Parser<T>) => Parser<U> {
  let transformer = function (parser: Parser<T>): Parser<U> {
    let nextParser = parser.chain((result) => {
      try {
        return Parsimmon.succeed(callback(result));
      } catch (error) {
        return Parsimmon.fail((typeof error === "object" || typeof error === "string") ? error?.toString() ?? "" : "");
      }
    });
    return nextParser;
  };
  return transformer;
}