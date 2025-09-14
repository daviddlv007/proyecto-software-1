# Makefile raíz - puente a /compose
%:
	$(MAKE) -C infra/compose $@
