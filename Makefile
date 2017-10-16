#
# Makefile -- master task runner.
#
# Type `make` or `make help` for list of available targets.
# `make qa` is the main one.
#

NMBIN = ./node_modules/.bin
SSPTOOL = node main.js --datadir=examples/opencontrols
LINTABLE =			\
	'*.js'			\
	'lib/**/*.js'		\
	'commands/*.js'		\
	'test/*.js'		\

default :: help

help :: pre-help usage post-help

usage ::
	@echo "make qa"

test-prep ::
	( cd examples ; compliance-masonry get )
usage ::
	@echo "make test-prep"

qa :: lint
lint ::
	@echo "Linting..."
	@$(NMBIN)/eslint $(LINTABLE)
usage ::
	@echo "make lint"

lint-fix ::
	$(NMBIN)/eslint --fix $(LINTABLE)

qa :: test
test ::
	@echo "Testing..."
	@$(NMBIN)/mocha -R dot
usage ::
	@echo "make test"

jsdoc ::
	$(NMBIN)/jsdoc -r lib -d jsdocs
usage ::
	@echo "make jsdoc"

demo ::
	(cd examples ; node ../main.js server)
usage ::
	@echo "make demo"

REGTEST_DATA = test/regtest
qa :: regtest
regtest ::
	@echo "CLI regression tests..."
	@$(SSPTOOL) list          | diff - ${REGTEST_DATA}/list.expect
	@$(SSPTOOL) validate 2>&1 | diff - ${REGTEST_DATA}/validate.expect

-include local.mk

pre-help post-help ::
	@echo ""

# QA success notification - must be last
qa ::
	@echo "================================"
	@echo "=== all QA checks passed     ==="
	@echo "================================"

#*EOF*
