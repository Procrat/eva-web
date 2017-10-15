TARGET=asmjs-unknown-emscripten
GENERATED=eva.js
OUTPUT=backend.js


all: debug

debug:
	(cd backend/ && cargo build --target=$(TARGET))
	cp backend/target/$(TARGET)/debug/$(GENERATED) dist/$(OUTPUT)
	npm run dev

release:
	(cd backend/ && cargo build --target=$(TARGET) --release)
	cp backend/target/$(TARGET)/release/$(GENERATED) dist/$(OUTPUT)
	npm run build
