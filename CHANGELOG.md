# Changelog

## [Unreleased]
- Experimental GraphQL support 
- Integrate PatternFly stylesheet (#6)

## [0.5.0] - 2020-05-28
- Support markdown in control descriptions (#19)
- Partial support for component schema v3.1.0 (#16)
- Add 'Reload' button
- `ssptool server`: can now specify port in `ssptool.yaml` file (#14)
- Drop dependency on unmaintained `gulp-gray-matter` package
- Refreshed other dependencies

## [0.4.6] - 2020-05-12
- Upgrade pug to version 3
- Add `last_modified` property to page metadata
- Add cross-references from pages to relevant controls
- Show minitoc in document views
- Guard against dangling references in `mapped_to` field

## [0.4.5] - 2019-03-16
- `ssptool validate` reports more details about validation errors
- Narrative text is interpreted as Markddown (fixes: #3)
- Further enhancements to Documents feature
- Updated package dependencies to latest version

## [0.4.4] - 2017-11-07
- Further enhancements to Documents feature:
  - Browsable in the web app at /documents/docid/sectionid
  - Printable version at /documents/docid
  - New /assets/ route for non-markdown assets
- Still more work to do but this seems like a good point for a snapshot release 

## [0.4.3] - 2017-10-31
- Improved layout and styling
- Now using less to generate additional *.css files
- HTML is enabled in *.md files
- Supports non-markdown content in --docdir (figures, attachments, &c)
- Pages section grouped into subdirectories
- NEW FEATURE (in process, alpha preview): documents

## [0.4.2] - 2017-10-26
- Control descriptions may comprise structured narrative text,
  similar to that found in *Component.satisfies* records.  
- (This is an extension to the standard OpenControl schema).
- A copy of the NIST-800-53 controls using this extension is 
  available at https://github.com/jenglish/NIST-800-53-Standards
- `ssptool validate` now checks markdown page frontmatter metadata
- New feature: can define components using page metadata 
  instead of/in addition to *component.yaml* files.
- Improved site navigation, again.

## [0.4.1] - 2017-10-22
- New feature: `ssptool refcheck` - check referential integrity

## [0.4.0] - 2017-10-19
- Loads Markdown content in --docdir, adds to Pages tab.
- Primitive report generation facility
- Completion report, for gap analysis 
- Using github wiki for all documentation for now

## [0.3.0] - 2017-10-16
- Cross-reference Components with the Controls they satisfy, and vice-versa
- Indicate which Certifications apply to each Control
- Added _Certifications_ tab
- Improved site navigation

## [0.2.0] - 2017-10-12
### User-visible changes
- New feature: `ssptool validate`
- Added json-schema schemas for OpenControl content
- Many bugfixes related to 404 errors
### Internal changes
- QA: now using ESLint on the regular
- More work on internal data model

## [0.1.0] - 2017-10-10
- Alpha release, basic data browsing only.
