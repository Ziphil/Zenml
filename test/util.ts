//


export function dedent(templateStrings: TemplateStringsArray, ...values: Array<unknown>): string {
  let strings = [...templateStrings.raw];
  strings[strings.length - 1] = strings[strings.length - 1].replace(/\r?\n([\t ]*)$/, "");
  let indentLengths = strings.reduce<Array<number>>((previous, string) => {
    let match = string.match(/\n([\t ]+|(?!\s).)/g);
    if (match) {
      return previous.concat(match.map((part) => part.match(/[\t ]/g)?.length ?? 0));
    } else {
      return previous;
    }
  }, []);
  if (indentLengths.length) {
    let pattern = new RegExp(`\n[\t ]{${Math.min(...indentLengths)}}`, "g");
    strings = strings.map((string) => string.replace(pattern, "\n"));
  }
  let string = strings[0];
  string = string.replace(/^\r?\n/, "");
  values.forEach((value, i) => {
    let endentations = string.match(/(?:^|\n)( *)$/);
    let endentation = (endentations) ? endentations[1] : "";
    let indentedValue = value;
    if (typeof value === "string" && value.includes("\n")) {
      indentedValue = String(value).split("\n").map((string, i) => (i === 0) ? string : `${endentation}${string}`).join("\n");
    }
    string += indentedValue + strings[i + 1];
  });
  return string;
}

export let $ = dedent;