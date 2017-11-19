#
# Makefile -- master task runner.
#
# Type `make` or `make help` for list of available targets.
# `make qa` is the main one.
#

NMBIN = ./node_modules/.bin
SSPTOOL = node $(CURDIR)/main.js

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
	$(NMBIN)/lessc less/style.less > public/css/style.css
	$(NMBIN)/lessc less/doc-style.less > public/css/doc-style.css
usage ::
	@echo "make css"

qa :: lint
lint ::
	@echo "Linting..."
	@$(NMBIN)/eslint $(LINTABLE)
usage ::
	@echo "make lint"

lint-fix ::
	$(NMBIN)/eslint --fix $(LINTABLE)

qa :: test
test :: $(TESTDATADIR)
test ::
	@echo "Testing..."
	@$(NMBIN)/mocha -R dot
usage ::
	@echo "make test"

qa :: jsdoc
jsdoc ::
	@echo "Running jsdoc..."
	@$(NMBIN)/jsdoc -c .jsdoc.json -r lib -d jsdocs
usage ::
	@echo "make jsdoc"

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

TD = examples/test
qa :: regtest
regtest :: $(TESTDATADIR)
regtest ::
	@echo "CLI regression tests..."
	@cd ${TD} ; $(SSPTOOL) list          | diff - regtest/list.expect
	@cd ${TD} ; $(SSPTOOL) validate 2>&1 | diff - regtest/validate.expect
	@cd ${TD} ; $(SSPTOOL) refcheck 2>&1 | diff - regtest/refcheck.expect
	@cd ${TD} ; $(SSPTOOL) report completion profile=FredRAMP-low \
		2>&1 | diff - regtest/report.expect
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
