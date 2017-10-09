# Overview

This is a nodejs / express application for working with [OpenControl] content.
It works in conjunction with [compliance-masonry] to generate
Sytem Security Plans and other compliance documentation.

# Quick demo

```/bin/sh
git clone [this repo]
( cd ssptool ; npm install)

git clone https://github.com/opencontrol/freedonia-compliance
cd freedonia compliance
compliance-masonry get
node /path/to/ssptool/main.js server
```
# More info

See [usage instructions](doc/usage.md) for more information.

# Colophon

Built with [express], [pug], and [Bootstrap 3].
Tested on node v8.0.0.

# References

[OpenControl]: http://open-control.org/
[compliance-masonry]: https://github.com/opencontrol/compliance-masonry
[express]: https://expressjs.com/
[pug]: https://pugjs.org/
[Bootstrap 3]: https://getbootstrap.com/docs/3.3/

