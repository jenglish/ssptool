#
# Makefile -- master task runner.
#
# Type `make` or `make help` for list of available targets.
# `make qa` is the main one.
#

SSPTOOL = npx ssptool

LINTABLE =			\
	'*.js'			\
	'lib/**/*.js'		\
	'commands/*.js'		\
	'test/*.js'		\

default :: help

help :: pre-help usage post-help

usage ::
	@echo "make qa"

TESTDATADIR = examples/test/opencontrols
DEMODATADIR = examples/demo/opencontrols

examples/%/opencontrols :
	@echo "Getting $* data..."
	(cd examples/$* ; compliance-masonry get)
clean ::
	-rm -rf examples/*/opencontrols

test-prep ::
	( cd examples/test ; compliance-masonry get )
usage ::
	@echo "make test-prep"

css ::
	npx lessc less/style.less > public/css/style.css
	npx lessc less/doc-style.less > public/css/doc-style.css
usage ::
	@echo "make css"

qa :: lint
lint ::
	@echo "Linting..."
	@npx eslint $(LINTABLE)
usage ::
	@echo "make lint"

lint-fix ::
	npx eslint --fix $(LINTABLE)

qa :: test
test :: $(TESTDATADIR)
test ::
	@echo "Testing..."
	@npx mocha -R dot
usage ::
	@echo "make test"

qa :: jsdoc
jsdoc ::
	@echo "Running jsdoc..."
	@npx jsdoc -c .jsdoc.json -r lib -d public/jsdocs
usage ::
	@echo "make jsdoc"
clean ::
	@-rm -rf public/jsdocs

demo : $(DEMODATADIR)
	cd examples/demo ; \
	$(SSPTOOL) validate ; \
	$(SSPTOOL) refcheck ; \
	$(SSPTOOL) server
usage ::
	@echo "make demo"

demo-ssp :: $(DEMODATADIR)
	cd examples/demo; \
	$(SSPTOOL) document ssp > SSP.html ;
usage ::
	@echo "make demo-ssp"
clean ::
	-rm -f examples/demo/SSP.html


test-server : $(TESTDATADIR)
	(cd examples/test ; node test-server.js)
usage ::
	@echo "make test-server"

qa :: regtest
regtest :: $(TESTDATADIR)
regtest ::
	@echo "CLI regression tests..."
	@$(MAKE) -sC examples/test regtest
usage ::
	@echo "make regtest"

-include local.mk

pre-help post-help ::
	@echo ""

# QA success notification - must be last
qa ::
	@echo "================================"
	@echo "=== all QA checks passed     ==="
	@echo "================================"

#*EOF*
