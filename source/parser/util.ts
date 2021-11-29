//

import {
  Parser
} from "parsimmon";


export function create<T, A extends Array<unknown>>(create: (...args: A) => Parser<T>): (...args: A) => Parser<T> {
  return create;
}