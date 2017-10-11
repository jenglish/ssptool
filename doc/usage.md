
# Basic usage

Should work out of the box as a basic data browser
in any directory with OpenControl content (an `opencontrol.yaml` file):

```
compliance-masonry get
ssptool server
```

Then point your web browser at localhost:3000

This will present a menu allowing you to browse
the raw OpenControl data, viz:

- Controls
- Components
- Certifications

# Validating data

```
ssptool validate
```

Validates all of the files in `opencontrols/` against
the schemas defined in [](../lib/opencontrol/schemas.js).

# Reports and documents

_TBD_.

