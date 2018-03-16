release:
	@echo "\x1b[32;01m--- Retrive new sources ---\x1b[0m"

	git fetch origin && git reset --hard master
	git clean -df -e offline

	@echo "\x1b[32;01m--- Build new files ---\x1b[0m"

	yarn install --prefer-offline && yarn run 'build:production'

	@echo "\x1b[32;01m--- Sync new files ---\x1b[0m"

	rsync -avhn ./public ../var/www/ --delete-after

clean:
	rm -rf public

.PHONY: release clean