//


export function isElement(node: Node): node is Element {
  return node.nodeType === 1;
}

export function isText(node: Node): node is Text {
  return node.nodeType === 3;
}

export function getDescendantTexts(element: Element): Array<Text> {
  const texts = [] as Array<Text>;
  for (let i = 0 ; i < element.childNodes.length ; i ++) {
    const child = element.childNodes.item(i);
    if (isText(child)) {
      texts.push(child);
    } else if (isElement(child)) {
      texts.push(...getDescendantTexts(child));
    }
  }
  return texts;
}

export function dedentDescendants(nodes: Array<Node>): void {
  const texts = [];
  if (nodes.length >= 1) {
    const firstNode = nodes[0];
    const lastNode = nodes[nodes.length - 1];
    if (isText(lastNode)) {
      const lastNodeContent = lastNode.data.replace(/[\x20\r\n]+$/, "");
      lastNode.data = lastNodeContent;
      lastNode.nodeValue = lastNodeContent;
    }
    for (const node of nodes) {
      if (isText(node)) {
        texts.push(node);
      } else if (isElement(node)) {
        texts.push(...getDescendantTexts(node));
      }
    }
    let indentLength = 100000;
    for (const text of texts) {
      const regexp = /(\r\n|\n|\r)(\x20+)/g;
      let match;
      while ((match = regexp.exec(text.data)) !== null) {
        if (match[2].length < indentLength) {
          indentLength = match[2].length;
        }
      }
    }
    for (const text of texts) {
      const textContent = text.data.replace(/(\r\n|\n|\r)(\x20+)/g, (match, breakString, spaceString) => breakString + " ".repeat(spaceString.length - indentLength));
      text.data = textContent;
      text.nodeValue = textContent;
    }
    if (isText(firstNode)) {
      const firstNodeContent = firstNode.data.replace(/^[\x20\r\n]+/, "");
      firstNode.data = firstNodeContent;
      firstNode.nodeValue = firstNodeContent;
    }
  }
}