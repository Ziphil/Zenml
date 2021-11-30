//

import "../constructor";


function isElement(this: Node): boolean {
  return this.nodeType === Node.ELEMENT_NODE;
}

function isText(this: Node): boolean {
  return this.nodeType === Node.TEXT_NODE;
}

function isComment(this: Node): boolean {
  return this.nodeType === Node.COMMENT_NODE;
}

Node.prototype.isElement = isElement;
Node.prototype.isText = isText;
Node.prototype.isComment = isComment;


declare global {

  interface Node {
    isElement(): this is Element;
    isText(): this is Text;
    isComment(): this is Comment;
  }

}