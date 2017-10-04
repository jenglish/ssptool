# Overview

This is a nodejs / express application for working with [OpenControl] content.
It works in conjunction with [compliance-masonry] to generate
SSPs, gap an

# Quick demo

```/bin/sh
git clone [this repo]
( cd ssptool ; npm install)

git clone https://github.com/opencontrol/freedonia-compliance
cd freedonia compliance
compliance-masonry get
node /path/to/ssptool/main.js server
```

# References

[OpenControl]: http://open-control.org/
[compliance-masonry]: https://github.com/opencontrol/compliance-masonry

