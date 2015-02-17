all: node_modules app

app: application.js src/Application.js

application.js: application.ts
	tsc --module commonjs application.ts

src/Application.js: src/Application.ts
	tsc --module commonjs src/Application.ts

node_modules:
	npm install --no-bin-link

clean:
	rm src/*.js