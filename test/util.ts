//


export function dedent(templateStrings: TemplateStringsArray, ...values: Array<unknown>): string {
  let strings = [...templateStrings];
  strings[strings.length - 1] = strings[strings.length - 1].replace(/\r?\n([\t ]*)$/, "");
  let indentLengths = strings.reduce<Array<number>>((previous, string) => {
    let matches = string.match(/\n([\t ]+|(?!\s).)/g);
    if (matches !== null) {
      return previous.concat(matches.map((match) => match.match(/[\t ]/g)?.length ?? 0));
    } else {
      return previous;
    }
  }, []);
  if (indentLengths.length) {
    let pattern = new RegExp(`\n[\t ]{${Math.min(...indentLengths)}}`, "g");
    strings = strings.map((string) => string.replace(pattern, "\n"));
  }
  let output = strings.join("").replace(/^\r?\n/, "");
  return output;
}