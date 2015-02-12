
all: node_modules application.js src/Server.js src/Application.js

application.js: application.ts
	tsc --module commonjs application.ts --noEmitOnError

src/Application.js: src/Application.ts
	tsc --module commonjs src/Application.ts --noEmitOnError

src/Server.js: src/Server.ts
	tsc --module commonjs src/Server.ts --noEmitOnError

node_modules:
	npm install --no-bin-link

clean:
	rm src/*.js