//

import fs from "fs";
import {
  ZenmlParserOptions
} from "../../source";
import {
  shouldEquivalent
} from "./util";


function shouldEquivalentFile(name: string, options?: ZenmlParserOptions): void {
  const input = fs.readFileSync(`./test/parser/file/${name}.zml`, {encoding: "utf-8"});
  const output = fs.readFileSync(`./test/parser/file/${name}.xml`, {encoding: "utf-8"});
  shouldEquivalent(input, output, options);
}

describe("practical examples", () => {
  test("diary", () => {
    const options = {specialElementNames: {brace: "x", bracket: "xn", slash: "i"}};
    shouldEquivalentFile("diary", options);
  });
  test("page", () => {
    shouldEquivalentFile("page");
  });
});