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

const zenmlString = "\\element<text>"  // some ZenML string
const document = parser.parse(zenmlString);  // parse it to get the XML document object

// use the usual XML serializer if you need the XML string
const serializer = new XMLSerializer();
const xmlString = serializer.serializeToString(document);
```

### Serialising an XML document in ZenML format
```typescript
import {DOMImplementation, DOMParser} from "@xmldom/xmldom";
import {ZenmlSerializer} from "@zenml/zenml";

const serializer = new ZenmlSerializer();  // create a serialiser

// use the usual XML parser to get an XML document object
const xmlString = "<element>text</element>";  // some XML string
const parser = new DOMParser();
const document = parser.parseFromString(xmlString, "text/xml");

const zenmlString = serializer.serialize(document);  // serialise the document in ZenML format
```