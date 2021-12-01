//


export interface CreatableDocument<E, T> {

  createElement(tagName: string): E;

  createTextNode(content: string): T;

}