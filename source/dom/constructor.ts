//

import {
  DOMImplementation
} from "@xmldom/xmldom";


let implementation = new DOMImplementation();
let document = implementation.createDocument(null, null, null);
let element = document.createElement("dummy");
let text = document.createTextNode("dummy");

global.Element = element.constructor as any;
global.Text = text.constructor as any;