
all: node_modules application.js src/Application.js

application.js: application.ts
	tsc --module commonjs application.ts --noEmitOnError

src/Application.js: src/Application.ts
	tsc --module commonjs src/Application.ts --noEmitOnError

node_modules:
	npm install --no-bin-link

clean:
	rm src/*.js