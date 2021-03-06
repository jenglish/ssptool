---
title: Introduction
author: Joe English <jenglish@flightlab.com>
date: 2017-10-24
version: 1.0.0
---

Genosha, Inc., a small engineering firm, found themselves faced
with the task of NIST 800-171 compliance, but had absolutely no idea where
to start. On top of that just last Thursday one of their partners asked
them to fill out a [CIS] security checklist, which they had never even
heard of before.

They decided that their best approach would be:

- Document their system in terms of the NIST-800-53 catalogue
- Use the control mapping tables in NIST-800-171 Appendix D
  to verify -171 compliance
- ... and find a similar mapping for the CIS checklist ...
- ... and whatever other requirements might come up next month ...


## First steps

They were all very proud of their physical security setup
and were eager to get that into OpenControl format,
so `PE_Policy` was the first component to be written up.
One control down!

It quickly became clear that they would need a more systematic
approach. A plan was needed. So they wrote one.  That became
their first document, and, as it turns out, also satisfies
NIST 800-53 CA-5. Two controls down!

## Moving on

Clearly they still have a long way to go, but the
[OpenControl] framework provides a solid starting point.

[OpenControl]: http://open-control.org/
[CIS]: https://www.cisecurity.org/
