
all: node_modules src/application.js

src/application.js: src/application.ts
	tsc --module commonjs src/application.ts

node_modules:
	npm install --no-bin-link
