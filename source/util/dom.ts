//


export function isElement(node: Node): node is Element {
  return node.nodeType === 1;
}

export function isText(node: Node): node is Text {
  return node.nodeType === 3;
}

export function getDescendantTexts(element: Element): Array<Text> {
  let texts = [];
  for (let child of Array.from(element.childNodes)) {
    if (isText(child)) {
      texts.push(child);
    } else if (isElement(child)) {
      texts.push(...getDescendantTexts(child));
    }
  }
  return texts;
}

export function dedentDescendants(nodes: Array<Node>): void {
  let texts = [];
  if (nodes.length >= 1) {
    let firstNode = nodes[0];
    let lastNode = nodes[nodes.length - 1];
    if (isText(lastNode)) {
      lastNode.data = lastNode.data.replace(/[\x20\n]+$/, "");
    }
    for (let node of nodes) {
      if (isText(node)) {
        texts.push(node);
      } else if (isElement(node)) {
        texts.push(...getDescendantTexts(node));
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
    if (isText(firstNode)) {
      firstNode.data = firstNode.data.replace(/^[\x20\n]+/, "");
    }
  }
}