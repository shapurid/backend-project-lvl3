run:
	npx babel-node src/bin/page-loader.js

install:
	npm link

build:
	npm run build

test:
	npm test
	
fix:
	npx eslint . --fix
	
lint:
	npx eslint .

publish:
	npm publish --dry-run
