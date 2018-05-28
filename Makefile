RUST_TARGET=wasm32-unknown-unknown
RUST_CHANNEL=nightly
BINDGEN_OPTS=--no-typescript


all: debug
.PHONY: all debug release deps dependencies test clean


# DEBUG

BACKEND_DEBUG_OUTPUT=backend/target/$(RUST_TARGET)/debug
FRONTEND_DEBUG_OUTPUT=generated-wasm/debug

debug: debug-wasm
	npm run dev

debug-wasm: $(FRONTEND_DEBUG_OUTPUT)/eva.js $(FRONTEND_DEBUG_OUTPUT)/eva_bg.wasm
.PHONY: debug-rust

$(BACKEND_DEBUG_OUTPUT)/eva.wasm: backend/src/*.rs backend/Cargo.toml backend/Cargo.lock
	(cd backend && cargo +$(RUST_CHANNEL) build --target=$(RUST_TARGET))

$(FRONTEND_DEBUG_OUTPUT)/eva.js $(FRONTEND_DEBUG_OUTPUT)/eva_bg.wasm: $(BACKEND_DEBUG_OUTPUT)/eva.wasm
	mkdir -p $(FRONTEND_DEBUG_OUTPUT)
	wasm-bindgen $(BACKEND_DEBUG_OUTPUT)/eva.wasm \
		--out-dir $(FRONTEND_DEBUG_OUTPUT) \
		$(BINDGEN_OPTS) --debug


# RELEASE

BACKEND_RELEASE_OUTPUT=backend/target/$(RUST_TARGET)/release
FRONTEND_RELEASE_OUTPUT=generated-wasm/release

release: $(FRONTEND_RELEASE_OUTPUT)/eva.js $(FRONTEND_RELEASE_OUTPUT)/eva_bg.wasm
	npm run build

$(BACKEND_RELEASE_OUTPUT)/eva.wasm: backend/src/*.rs backend/Cargo.toml backend/Cargo.lock
	(cd backend && cargo +$(RUST_CHANNEL) build --release --target=$(RUST_TARGET))

$(FRONTEND_RELEASE_OUTPUT)/eva.js $(FRONTEND_RELEASE_OUTPUT)/eva_bg.wasm: $(BACKEND_RELEASE_OUTPUT)/eva.wasm
	mkdir -p $(FRONTEND_RELEASE_OUTPUT)
	wasm-bindgen $(BACKEND_RELEASE_OUTPUT)/eva.wasm \
		--out-dir $(FRONTEND_RELEASE_OUTPUT) \
		$(BINDGEN_OPTS)


# DEPENDENCIES

deps: dependencies
dependencies: rust-dependencies node-dependencies
.PHONY: rust-dependencies node-dependencies

rust-dependencies:
	rustup target add --toolchain $(RUST_CHANNEL) $(RUST_TARGET)

node-dependencies:
	npm install


# TEST

test: rust-test node-test
.PHONY: rust-test node-test

rust-test:
	(cd backend/ && cargo +$(RUST_CHANNEL) test)

node-test: $(FRONTEND_DEBUG_OUTPUT)/eva.js $(FRONTEND_DEBUG_OUTPUT)/eva_bg.wasm
	npm test


# CLEAN

clean:
	rm -rf backend/target node_modules dist
