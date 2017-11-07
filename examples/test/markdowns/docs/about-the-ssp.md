---
title: About the System Security Plan
version: draft
---

The typical USA FedRAMP system security plan (SSP)
is written from a 304-page Microsoft document. See here:
https://www.fedramp.gov/resources/templates-2016

The first 12 sections are a narrative that is independent of the
structure of the controls that OpenControl specifies with `component.yaml`
files. The table of contents for the initial 12
sections is like this:

```
1	Information System Name/Title	1
2	Information System Categorization	1
3	Information System Owner	5
4	Authorizing Official	5
5	Other Designated Contacts	6
6	Assignment of Security Responsibility	7
7	Information System Operational Status	7
8	Information System Type	8
9	General System Description	10
10	System Environment	13
11	System Interconnections	16
12	Laws, Regulations, Standards, and Guidance	17
```

## How are images included?

Markdown syntax should work:

![Waterfall SDLC Image](./Waterfall_model.png)

You can also use embedded HTML.
Recommend using a *figure* element wrapper, and storing
files under `/assets/`.

<figure>
<img src="/assets/cat-picture.svg"/>
<figcaption>Cat picture by FASTILY [CC BY-SA 4.0]</figcaption>
</figure>

## References

- [Wikimedia Commons](https://commons.wikimedia.org/wiki/File%3ABlack_and_White_Cat_Sketch.svg)

