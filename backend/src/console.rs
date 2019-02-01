use js_sys::JSON;
use wasm_bindgen::prelude::*;

#[allow(dead_code)]
pub fn log(obj: &JsValue) {
    web_sys::console::log_1(&JSON::stringify(obj).unwrap().into())
}

#[allow(dead_code)]
pub fn error(obj: &JsValue) {
    web_sys::console::error_1(&JSON::stringify(obj).unwrap().into())
}
