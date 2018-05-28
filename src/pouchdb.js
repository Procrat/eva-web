// This modules provides a compatibility layer while waiting for wasm-bindgen
// to support more expressive forms of imports.

const PouchDB = require('pouchdb').default;

exports.PouchDB = PouchDB;
