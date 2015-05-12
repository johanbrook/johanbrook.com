build: node_modules
	npm run build

serve: node_modules
	npm run serve

node_modules: package.json
	npm install

.PHONY: build
