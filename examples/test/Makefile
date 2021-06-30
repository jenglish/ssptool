
SSPTOOL = npx ssptool
DIFF = diff -u

default :: usage

usage ::
	@echo "make regtest - CLI regression tests"

regtest ::
	@$(SSPTOOL) document doc1 > /dev/null
	@$(SSPTOOL) list          | ${DIFF} regtest/list.expect -
	@$(SSPTOOL) validate 2>&1 | ${DIFF} regtest/validate.expect -
	@$(SSPTOOL) refcheck 2>&1 | ${DIFF} regtest/refcheck.expect -
	@$(SSPTOOL) report completion profile=FredRAMP-low \
		2>&1 | ${DIFF} regtest/report.expect - ;

