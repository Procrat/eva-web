TARGET=asmjs-unknown-emscripten
GENERATED=eva.js
OUTPUT=backend.js


all: debug

debug:
	cargo build --target=$(TARGET)
	cp target/$(TARGET)/debug/$(GENERATED) docs/dist/$(OUTPUT)
	cd docs && npm run dev

release:
	cargo build --target=$(TARGET) --release
	cp ./target/$(TARGET)/release/$(GENERATED) ./docs/dist/$(OUTPUT)
	cd docs && npm run build
