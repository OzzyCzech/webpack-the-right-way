release:
	@echo "--- Retrive new sources ---"
	git fetch origin && git reset --hard master
    git clean -df
    git submodule sync
    git submodule update -f

    @echo "--- Build new files ---"
    yarn install --prefer-offline && yarn run build:production

    @echo "--- Sync new files ---"
    rsync -avhn ./public ../var/www/ --delete-after

.PHONY: release