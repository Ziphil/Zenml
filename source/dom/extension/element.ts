//

import "../constructor";


function getDescendantTexts(this: Element): Array<Text> {
  let texts = [];
  for (let child of Array.from(this.childNodes)) {
    if (child.isText()) {
      texts.push(child);
    } else if (child.isElement()) {
      texts.push(...child.getDescendantTexts());
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