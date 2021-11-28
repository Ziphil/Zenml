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

型情報がない [Ruby 実装](https://github.com/Ziphil/Zenithal)を使い続けたくないし、Web システムに組み込みやすくしたかったので、TypeScript 実装を新たに作ろうとは思ったけど、ZenML インフラを全部再実装するのしんどすぎてつらいねってなってるところです。
とりあえずリポジトリ作っておいて気が向いたときにまったりやろうかなって。

## ZenML インフラ一覧

| TypeScript 実装 | Ruby 実装 |
|:--:|:--:|
| [ZenML パーサー](https://github.com/Ziphil/Zenml) | [ZenML パーサー](https://github.com/Ziphil/Zenithal) |
| ~~Zotica パーサー~~ | [Zotica パーサー](https://github.com/Ziphil/ZenithalMathWeb) |
| ~~XML 変換ユーティリティ~~ | [XML 変換ユーティリティ](https://github.com/Ziphil/Zenithal) |
| ~~書籍生成ユーティリティ~~ | [書籍生成ユーティリティ](https://github.com/Ziphil/ZenithalBook) |
| ~~スライド生成ユーティリティ~~ | [スライド生成ユーティリティ](https://github.com/Ziphil/ZenithalSlide) |