# SSPTOOL

This is a node.js / express application for working with [OpenControl] content.
It works in conjunction with [compliance-masonry] to generate
System Security Plans and other compliance documentation.

Features include:

- Web application for browsing compliance data
- Command-line interface for batch operations
- Validation
- Report generation
- *(new!)* GraphQL query API *(added Jun 2021)*

## Status

Currently _(Jun 2021)_ in beta / dogfood mode.
Progress is being tracked on the [project board].

## Intended audience

It is hoped that this tool will be useful
for people tasked with security compliance requirements
who feel more comfortable with Markdown and YAML
than with MS Word and Excel.

## Quick start

```/bin/sh
git clone [this repo]
( cd ssptool ; npm install)
```

Basic features should work out of the box
in any directory with OpenControl content:

```
compliance-masonry get
node /path/to/ssptool/main.js server
```

Then point your web browser at localhost:3000

Run `ssptool help` for more options.

## More info

Most documentation is on the [wiki] for now.

## Colophon

Built with [express], [pug], and [Bootstrap 3] / [PatternFly 3].
Tested on node v8.0.0.

[OpenControl]: http://open-control.org/
[compliance-masonry]: https://github.com/opencontrol/compliance-masonry
[express]: https://expressjs.com/
[pug]: https://pugjs.org/
[Bootstrap 3]: https://getbootstrap.com/docs/3.3/
[PatternFly 3]: https://www.patternfly.org/v3/
[wiki]: https://github.com/jenglish/ssptool/wiki
[project board]: https://github.com/jenglish/ssptool/projects/1

