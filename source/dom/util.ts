//


export function dedentDescendants(nodes: Array<Node>): void {
  let texts = [];
  if (nodes.length >= 1) {
    let firstNode = nodes[0];
    let lastNode = nodes[nodes.length - 1];
    if (lastNode.isText()) {
      lastNode.data = lastNode.data.replace(/[\x20\n]+$/, "");
    }
    for (let node of nodes) {
      if (node.isText()) {
        texts.push(node);
      } else if (node.isElement()) {
        texts.push(...node.getDescendantTexts());
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
    if (firstNode.isText()) {
      firstNode.data = firstNode.data.replace(/^[\x20\n]+/, "");
    }
  }
}