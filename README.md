# Web interface for [Eva](https://github.com/Procrat/eva)  [![Build Status](https://travis-ci.org/Procrat/eva-web.svg?branch=master)](https://travis-ci.org/Procrat/eva-web)

> Let algorithms decide your life.


## Disclaimer: work in progress

This project hasn't reached an alpha state yet. At the moment, it is just a tiny
CLI wrapper around a simple scheduling algorithm. Some people already find this
useful however, so maybe you do too!


## [Quick demo](https://procrat.github.io/eva-web)


## Build your own Eva web UI

This project is made up of two parts:
- a small wrapper in Rust around the [eva](https://github.com/Procrat/eva) crate
  that interfaces with non-Rust languages using JSON messages. The root of this
  part is in `backend`.
- a [Vue.js](https://vuejs.org/) front-end that interacts with an
  [asm.js](http://asmjs.org/)/[Emscripten](http://emscripten.org) build of the
  Rust wrapper.

If you haven't built a Rust project before, install
[rustup](https://www.rustup.rs), and run `rustup install nightly` to install the
latest nightly version of Rust.

If you haven't run a JavaScript project before, install
[npm](https://www.npmjs.com/).

Install [Emscripten](http://emscripten.org) either through your system package
manager or with
[emsdk](https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html).

Alternatively, run the
[procrat/rust-asmjs](https://hub.docker.com/r/procrat/rust-asmjs/) Docker image
which includes all these dependencies.

``` bash
# Install the Rust and JavaScript dependencies once
make dependencies

# Ensure that we have an asm.js build of the Rust wrapper in the right place,
# and run a development server with hot reloading at localhost:8080
make
```
