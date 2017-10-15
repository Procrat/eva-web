TARGET=asmjs-unknown-emscripten
GENERATED=eva.js
OUTPUT=backend.js


all: debug

debug:
	(cd backend/ && cargo build --target=$(TARGET))
	mkdir -p dist/
	cp backend/target/$(TARGET)/debug/$(GENERATED) dist/$(OUTPUT)
	npm run dev

release: rust-release node-release

rust-release:
	(cd backend/ && cargo build --target=$(TARGET) --release)
	mkdir -p dist/
	cp backend/target/$(TARGET)/release/$(GENERATED) dist/$(OUTPUT)

node-release:
	npm run build

dependencies: rust-dependencies node-dependencies

rust-dependencies:
	rustup target add $(TARGET)

node-dependencies:
	npm install

test: rust-test node-test

rust-test:
	(cd backend/ && cargo build --verbose --target=$(TARGET))

node-test:
	npm run build

clean:
	rm -rf dist/ || true
