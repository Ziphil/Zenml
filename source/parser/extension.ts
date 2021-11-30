//

import Parsimmon from "parsimmon";
import {
  Parser
} from "parsimmon";


function maybe<T>(this: Parser<T>): Parser<T | null> {
  return this.times(0, 1).map((result) => result[0] ?? null);
}

function mapCatch<T, U>(this: Parser<T>, callback: (result: T) => U): Parser<U> {
  let nextParser = this.chain((result) => {
    try {
      return Parsimmon.succeed(callback(result));
    } catch (error) {
      return Parsimmon.fail((typeof error === "object" || typeof error === "string") ? error?.toString() ?? "" : "");
    }
  });
  return nextParser;
}

Parser.prototype.maybe = maybe;
Parser.prototype.mapCatch = mapCatch;


declare module "parsimmon" {

  interface Parser<T> {
    maybe: typeof maybe;
    mapCatch: typeof mapCatch;
  }

}