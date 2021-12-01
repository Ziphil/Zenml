//


export interface CreatableDocument<E, T> {

  createElement(name: string): E;

  createTextNode(content: string): T;

}