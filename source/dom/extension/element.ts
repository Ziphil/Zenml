//

import "../constructor";


function getDescendantTexts(this: Element): Array<Text> {
  let texts = [];
  for (let child of Array.from(this.childNodes)) {
    if (child.nodeType === 3) {
      let text = child as Text;
      texts.push(text);
    } else if (child.nodeType === 1) {
      let element = child as Element;
      texts.push(...element.getDescendantTexts());
    }
  }
  return texts;
}

Element.prototype.getDescendantTexts = getDescendantTexts;


declare global {

  interface Element {
    getDescendantTexts: typeof getDescendantTexts;
  }

}