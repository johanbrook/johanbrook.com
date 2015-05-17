build: deps
	npm run build

serve: deps
	npm run serve

deploy: build
	# Deploy to johanbrook.github.io/johanbrook.com
	cd ./build && \
	cp ../CNAME ./CNAME && \
	touch ./.nojekyll && \
	git init . -q && \
	git add . && \
	git commit -m "Deploy [`date`]" --quiet && \
  git log -n 1; \
	git push "git@github.com:johanbrook/johanbrook.com.git" master:gh-pages --force && \
	rm -rf .git && \
	cd ..

new:
	@coffee scripts/new.coffee --silent '${TITLE}' | xargs ${EDITOR}

clean:
	rm -rf ./build

deps: package.json
	npm install

.PHONY: build new
