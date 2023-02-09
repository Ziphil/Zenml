//

import Parsimmon from "parsimmon";
import {
  Parser
} from "parsimmon";


export function maybe<T>(parser: Parser<T>): Parser<T | null> {
  return parser.times(0, 1).map((result) => result[0] ?? null);
}

export function mapCatch<T, U>(callback: (result: T) => U): (parser: Parser<T>) => Parser<U> {
  const convert = function (parser: Parser<T>): Parser<U> {
    const nextParser = parser.chain((result) => {
      try {
        return Parsimmon.succeed(callback(result));
      } catch (error) {
        return Parsimmon.fail((typeof error === "object" || typeof error === "string") ? error?.toString() ?? "" : "");
      }
    });
    return nextParser;
  };
  return convert;
}

export function create<T, S>(create: (state: S) => Parser<T>): StateParser<T, S> {
  return create;
}

export type StateParser<T, S> = (state: S) => Parser<T>;