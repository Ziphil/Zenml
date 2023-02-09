## Syntax of ZenML (version 1.1)

### Introduction
This document provides a simple description of the ZenML syntax.
This is not a formal definition of the syntax.

In each example below, the first code is a sample ZenML markup and the next is the result of converting it to XML.

### Element
An element is denoted by an element name after `\`, and its content is surrounded by `<` and `>`:
```
\tag<This is a content of the tag>
```
```xml
<tag>This is a content of the tag</tag>
```

Attributes are enclosed in `|` and placed between a tag name and `<`.
Each attribute-value pair is written as `attr="value"`, with the attribute name and value joined by `=`.
Attribute-value pairs are separated by `,`.
Note that an attribute value must always be enclosed in `"`, not in `'`.
```
\tag|attr="value",foo="bar"|<content>
```
```xml
<tag attr="value" foo="bar">content</tag>
```

The value of an attribute may be omitted.
In this case, the resulting attribute will have the same value as its name.
```
\tag|boolean|<content>
```
```xml
<tag boolean="boolean">content</tag>
```

An empty element is denoted like `\tag<>`, but can be abbreviated to `\tag;`.
```
\tag; \tag|attr="value"|;
```
```xml
<tag/> <tag attr="value"/>
```

Of course, you can place any number of elements inside another element, as is usual in XML: 
```
\tag<nested element: \child<\child<\child<foo>>>>
```
```xml
<tag>nested element: <child><child><child>foo</child></child></child></tag>
```

You can freely insert whitespaces at the following position.
These whitespaces are simply ignored in the parsing process, and removed in the resulting XML.

- after an element name
- after `|` at the beginning of attribute-value pairs
- before and/or after `=` used in an attribute-value pair
- before and/or after `,` separating attribute-value pairs
- before `|` at the end of attribute-value pairs
- between `|` at the end of attribute-value pairs and `<` at the beginning of the content
- between `|` at the end of attribute-value pairs and `;` when the element is empty

Thus the following code is valid:
```
\tag | foo = "foo" , bar = "bar" ,
baz = "baz"
|
<content>
\tag | foo = "foo" | ;
\tag >
```
```xml
<tag foo="foo" bar="bar" baz="baz">content</tag>
<tag foo="foo"/>
<tag/>
```

### Changing the treatment of the inner text
If the element name is suffixed with `*`, the same number of leading whitespaces as in the least indented line will be removed from each line.
This can be useful, if you want to insert indentations in the inner text for readability, but do not want them to remain in the output, for example when marking up a `<pre>` element of XHTML.
```
\div<
  \pre*<
    foobarbazfoobarbaz
      foobarbaz
        foobarbaz
    foobarbazfoobarbaz
  >
>
```
```xml
<div>
  <pre>foobarbazfoobarbaz
  foobarbaz
    foobarbaz
foobarbazfoobarbaz</pre>
</div>
```

If the element name is suffixed with `~`, the inner text is treated as a textual data without any element or macro.
It behaves similarly to CDATA sections in XML, but escape characters are still valid inside the `~`-sufficed element.
```
\tag~<escape: `< \inner|attr="val"|<foo`> ← this must be escaped>
```
```xml
<tag>escape: &lt; \inner|attr=&quot;val&quot;|&lt;foo&gt; ← this must be escaped</tag>
```
Note that the inner text ends with `>`, so if you want to include `>` in the inner text, you have to escape it.

These options can be used simultaneously, regardless of the order of the suffixes.
```
\pre~*<
  public static void main(String... args) {
    for (int i = 0 ; i < 5 ; i ++) {
      System.out.println("Hello");
    }
    System.out.println("End");
  }
>
```
```xml
<pre>public static void main(String... args) {
  for (int i = 0 ; i &lt; 5 ; i ++) {
    System.out.println(&quot;Hello&quot;);
  }
  System.out.println(&quot;End&quot;);
}</pre>
```

### Syntactic sugar for multiple elements
If consecutive elements share the same name, you can omit the name of the second and any subsequent elements, by adding `+` after the name of the first element.
```
\tag+<first><second><third>
```
```xml
<tag>first</tag><tag>second</tag><tag>third</tag>
```

If the first element, suffixed with `+`, has some attributes, the remaining elements all have the same attributes.
```
\tag+|attr="val"|<first><second><third>
```
```xml
<tag attr="val">first</tag><tag attr="val">second</tag><tag attr="val">third</tag>
```

### Processing instruction
The syntax for processing instructions is identical to that for normal elements, except that the element name must end with `?`.
```
\xml?<version="1.0" encoding="UTF-8">
```
```xml
<?xml version="1.0" encoding="UTF-8"?>
```

The content of processing instructions is often written in pseudo attributes.
In ZenML, these pseudo-attributes can be written in the same way as ordinary attributes, so the following ZenML code is converted to the same XML as above.
```
\xml?|version="1.0",encoding="UTF-8"|;
```
Note that there must be `,` between attribute-value pairs when using this syntax.
In addition, `;` is required at the end of the element to indicate that the content is empty.

The XML declaration is not a processing instruction, but it is expressed by using this syntax.

### ZenML declaration
ZenML documents should (but do not have to) start with a ZenML declaration, as follows:
```
\zml?|version="1.1"|;
```
ZenML declarations are only used during processing, and are removed from the output XML.

The version and the element name for special elements (explained below) must be declared in the pseudo-attribute style.
Thus, for example, `\zml?<version="1.1">` is not valid.

### Escape characters
The following symbols can be escaped by prefixing them with `` ` ``.

- `&`, `<`, `>`, `;`, `"`, `{`, `}`, `[`, `]`, `/`, `\`, `|`, `` ` ``, `#`

These can be used in both text nodes and attribute values.

```
`[ escaped `] \tag|attr="`"`&"|;
```
```xml
[ escaped ] <tag attr="&quot;&amp;"/>
```

### Special tag
Braces (`{}`), brackets (`[]`) and slashes (`//`) are treated as a special tag in ZenML, and are converted to certain elements in XML.
In the ZenML declaration, you must specify the names of elements to which these special tags are converted.
```
\zml?|version="1.0",brace="a",bracket="b",slash="c"|;
{brace} [bracket] /slash/
```
```xml
<a>brace</a> <b>bracket</b> <c>slash</c>
```
The parser implementation in this repository does not currently support specifying the elements of special elements in this way.
This will be supported in a future update.

Alternatively, you can tell the parser the names of the special elements in advance.

If you do not specify the names of the special elements in either way, an error will occur when the parser tries to parse a special element.

### Macro
If the name of an element is preceded by `&` instead of `\`, the element is treated as a macro.
A ZenML document alone does not determine how macros are converted, so you need to provide the parser with a configuration of converting macros beforehand.

### Comment
A comment starts with `#<` and ends with `>`.
In addition to this XML-style comment, ZenML supports a single-line comment, which is started with `##`.
```
\tag<foo> #<comment> \tag<bar>
## one-line comment
```
```xml
<tag>foo</tag> <!-- comment --> <tag>bar</tag>
<!-- one-line comment -->
```

### CDATA section
In ZenML, there is no equivalent to the CDATA section of XML, but you can achieve a similar effect by using a `~`-suffixed element.

### Document type declaration
ZenML does not support markup of document type declarations.