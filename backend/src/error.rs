use derive_more::From;
use wasm_bindgen::JsValue;

#[derive(Debug, From)]
pub struct Error(anyhow::Error);

impl From<eva::Error> for Error {
    fn from(error: eva::Error) -> Error {
        Error(error.into())
    }
}

impl From<Error> for JsValue {
    fn from(error: Error) -> JsValue {
        JsValue::from(format!("{:#}", error.0))
    }
}

pub type Result<T> = std::result::Result<T, Error>;
