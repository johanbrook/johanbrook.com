build: node_modules
	npm run build

serve: node_modules
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

node_modules: package.json
	npm install

.PHONY: build
