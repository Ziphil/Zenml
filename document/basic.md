## Usage by examples

### Parsing an ZenML document
```typescript
import {DOMImplementation, XMLSerializer} from "@xmldom/xmldom";
import {ZenmlParser} from "@zenml/zenml";

const parser = new ZenmlParser(new DOMImplementation(), {  // create a parser
  specialElementNames: {
    brace: "brace",      // name for brace elements
    bracket: "bracket",  // name for bracketr elements
    slash: "slash"      // name for slash elements
  }
});

const input = ""  // some input string
const document = parser.parse(input);  // perform parsing to get the XML document object

// use the usual XML serializer if you need the XML string
const serializer = new XMLSerializer();
const xmlString = serializer.serializeToString(document);
```