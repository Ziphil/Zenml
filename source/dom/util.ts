//


export function dedentChildren(children: Array<Node>): void {
  let texts = [];
  let firstChild = children[0];
  let lastChild = children[children.length - 1];
  if (lastChild.isText()) {
    lastChild.data = lastChild.data.replace(/[\x20\n]+$/, "");
  }
  for (let child of children) {
    if (child.isText()) {
      texts.push(child);
    } else if (child.isElement()) {
      texts.push(...child.getDescendantTexts());
    }
  }
  let indentLength = 100000;
  for (let text of texts) {
    let matches = text.data.match(/\n(\x20+)/g) ?? [];
    for (let match of matches) {
      if (match.length < indentLength) {
        indentLength = match.length;
      }
    }
  }
  for (let text of texts) {
    text.data = text.data.replace(/\n(\x20+)/g, (match) => "\n" + " ".repeat(match.length - indentLength));
  }
  if (firstChild.isText()) {
    firstChild.data = firstChild.data.replace(/^[\x20\n]+/, "");
  }
}