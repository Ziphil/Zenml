//


export function dedentChildren(children: Array<Node>): void {
  let texts = [];
  if (children[children.length - 1].nodeType === 3) {
    let text = children[children.length - 1] as Text;
    text.data = text.data.replace(/[\x20\n]+$/, "");
  }
  for (let child of children) {
    if (child.nodeType === 3) {
      let text = child as Text;
      texts.push(text);
    } else if (child.nodeType === 1) {
      let element = child as Element;
      texts.push(...element.getDescendantTexts());
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
  if (children[0].nodeType === 3) {
    let text = children[0] as Text;
    text.data = text.data.replace(/^[\x20\n]+/, "");
  }
}