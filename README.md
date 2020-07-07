# Web interface for [Eva](https://github.com/Procrat/eva)  [![Build Status](https://travis-ci.org/Procrat/eva-web.svg?branch=master)](https://travis-ci.org/Procrat/eva-web)

> Let algorithms decide your life.


## Disclaimer: work in progress

This project hasn't reached an alpha state yet. At the moment, it is just a tiny
web interface around a simple scheduling algorithm. Some people already find
this useful however, so maybe you do too!


## Live

You can freely use the version available on
[procrat.github.io/eva-web](https://procrat.github.io/eva-web).

If you enjoy it so far and want to say thanks, you can [buy me a coffee ☕](https://ko-fi.com/procrat).

## Build your own Eva web UI

This project is made up of two parts:
- a small wrapper in Rust around the [eva](https://github.com/Procrat/eva) crate
  that interfaces with non-Rust languages using JSON messages. The root of this
  part is in `backend`.
- a [Vue.js](https://vuejs.org/) front-end that interacts with a
  [WebAssembly](https://webassembly.org/) build of the Rust wrapper.

### Prerequisites

If you haven't built a Rust project before, install
[rustup](https://www.rustup.rs), and run `rustup install nightly` to install the
latest nightly version of Rust.

If you haven't run a JavaScript project before, install
[npm](https://www.npmjs.com/).

Install [`wasm-bindgen-cli`](https://github.com/rustwasm/wasm-bindgen) of the
same version as `wasm-bindgen` in the `Cargo.lock` file. This program is used to
generate JavaScript wrapper functions for our wasm build:
```bash
cargo install --version <same-version-as-wasm-bindgen> wasm-bindgen-cli
```

### Build

``` bash
# Install the Rust and JavaScript dependencies once
make dependencies

# Make the wasm build with JavaScript wrapper and start a development server
# with hot reloading at localhost:8080
make
```
