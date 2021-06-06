# SSPTOOL

This is a node.js / express application for working with [OpenControl] content.
It works in conjunction with [compliance-masonry] to generate
System Security Plans and other compliance documentation.

Features include:

- Web application for browsing compliance data
- Command-line interface for batch operations
- Validation
- Report generation

## Status

Currently _(Oct 2017)_ in early development / dogfood mode.
Progress is being tracked on the [project board].

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

All documentation is on the [wiki] for now.

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

