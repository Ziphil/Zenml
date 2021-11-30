//

import {
  Parser
} from "parsimmon";


export function create<T, S>(create: (state: S) => Parser<T>): StateParser<T, S> {
  return create;
}

export type StateParser<T, S> = (state: S) => Parser<T>;