//

import fs from "fs";
import {
  ZenmlParserOptions,
  ZenmlPlugin
} from "../../source";
import {
  shouldEquivalent
} from "./util";


function shouldEquivalentFile(name: string, options?: ZenmlParserOptions, plugins?: Array<[string, ZenmlPlugin]>): void {
  let input = fs.readFileSync(`./test/parser/file/${name}.zml`, {encoding: "utf-8"});
  let output = fs.readFileSync(`./test/parser/file/${name}.xml`, {encoding: "utf-8"});
  shouldEquivalent(input, output, options, plugins);
}

describe("practical examples", () => {
  test("diary", () => {
    let options = {specialElementNames: {brace: "x", bracket: "xn", slash: "i"}};
    shouldEquivalentFile("diary", options);
  });
  test("page", () => {
    shouldEquivalentFile("page");
  });
});