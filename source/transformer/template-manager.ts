//

import {
  NodeLike
} from "../builder/type";
import type {
  Transformer
} from "./transformer";


export class TransformTemplateManager<D, F, E, T> {

  private readonly rules: Array<[Pattern, Pattern, RuleFunction<D, F, E, T>]>;
  private readonly functions: Map<string, FunctionFunction<D, F, E, T>>;

  public constructor() {
    this.rules = [];
    this.functions = new Map();
  }

  public registerRule(tagNamePattern: Pattern, scopePattern: Pattern, rule: RuleFunction<D, F, E, T>): void {
    this.rules.push([tagNamePattern, scopePattern, rule]);
  }

  public registerFunction(name: string, function2: FunctionFunction<D, F, E, T>): void {
    this.functions.set(name, function2);
  }

  public regsiterTemplateManager(manager: TransformTemplateManager<D, F, E, T>): void {
    for (let addedRule of manager.rules) {
      this.rules.push(addedRule);
    }
    for (let [addedName, addedFunction] of manager.functions) {
      this.functions.set(addedName, addedFunction);
    }
  }

  public findRule(tagName: string, scope: string): RuleFunction<D, F, E, T> | null {
    for (let [tagNamePattern, scopePattern, rule] of this.rules) {
      if (matchString(tagName, tagNamePattern) && matchString(scope, scopePattern)) {
        return rule;
      }
    }
    return null;
  }

  public findFunction(name: string): FunctionFunction<D, F, E, T> | null {
    return this.functions.get(name) ?? null;
  }

}


function matchString(string: string, pattern: Pattern): boolean {
  if (typeof pattern === "function") {
    return pattern(string);
  } else if (pattern instanceof RegExp) {
    return string.match(pattern) !== null;
  } else {
    return string === pattern;
  }
}


export type Pattern = string | RegExp | ((string: string) => boolean);
export type Patterns = {tagName: Pattern, scope: Pattern};

export type RuleFunction<D, F, E, T> = (transformer: Transformer<D, F, E, T>, document: D, element: E, scope: string, args: any) => NodeLike<F, E, T>;
export type FunctionFunction<D, F, E, T> = (transformer: Transformer<D, F, E, T>, document: D, element: E, args: any) => NodeLike<F, E, T>;