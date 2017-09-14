TARGET=asmjs-unknown-emscripten
OUTPUT=eva.js


all: debug

debug:
	cargo build --target=$(TARGET)
	cp target/$(TARGET)/debug/$(OUTPUT) docs/dist/$(OUTPUT)
	cd docs && npm run dev

release:
	cargo build --target=$(TARGET) --release
	cp ./target/$(TARGET)/release/$(OUTPUT) ./docs/dist/$(OUTPUT)
	cd docs && npm run build
