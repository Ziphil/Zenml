<div align="center">
<h1>Zenithal Markup Language (ZenML)</h1>
</div>

![](https://img.shields.io/github/package-json/v/Ziphil/Zenml)
![](https://img.shields.io/github/commit-activity/y/Ziphil/Zenml?label=commits)
![](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2FZiphil%2FZenml%2Fbadge%3Fref%3Ddevelop&label=test&style=flat&logo=none)
[![](https://img.shields.io/codecov/c/github/Ziphil/Zenml)](https://app.codecov.io/gh/Ziphil/Zenml)


## Overview
Zenithal Markup Language (ZenML) is an alternative syntax for XML.
It is almost fully compatible with XML, and less redundant and more readable than XML.

This repository provides a script for parsing a ZenML document to an XML DOM, together with some utility classes which help transform XML documents.

## Installation
Install via [npm](https://www.npmjs.com/package/@zenml/zenml).
```
npm i @zenml/zenml
```

## Documentation
- [Syntax of ZenML](document/syntax.md)

## ZenML/XML infrastructure
There are several libraries related to ZenML/XML, which I call “ZenML/XML infrastructure”.
The following list shows all the components of the infrastructure:

| TypeScript impls | Ruby impls |
|:--:|:--:|
| [ZenML parser](https://github.com/Ziphil/Zenml) | [ZenML parser](https://github.com/Ziphil/Zenithal) |
| [Zotica parser](https://github.com/Ziphil/ZenmlZotica) | [Zotica parser](https://github.com/Ziphil/ZenithalMathWeb) |
| [utilities and extensions of XML DOM](https://github.com/Ziphil/ZenmlXmldom) | [utilities and extensions of XML DOM](https://github.com/Ziphil/Zenithal) |
| [utilities for XML transformation](https://github.com/Ziphil/Zenml) | [utilities for XML transformation](https://github.com/Ziphil/Zenithal) |
| ~~utilities for book generation~~ | [utilities for book generation](https://github.com/Ziphil/ZenithalBook) |
| [utilities for slide generation](https://github.com/Ziphil/ZenmlSlide) | [utilities for slide generation](https://github.com/Ziphil/ZenithalSlide) |