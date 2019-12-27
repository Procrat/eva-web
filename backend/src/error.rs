use failure::Fail;

#[derive(Debug, Fail)]
pub enum Error {
    #[fail(display = "{}", _0)]
    Serialisation(#[cause] serde_json::Error),
    #[fail(display = "{}", _0)]
    Eva(#[cause] eva::Error),
    #[fail(display = "A database error occurred {}: {}", _0, _1)]
    Database(&'static str, #[cause] failure::Error),
    #[fail(display = "{}", _0)]
    Configuration(String),
}

impl From<serde_json::Error> for Error {
    fn from(error: serde_json::Error) -> Self {
        Self::Serialisation(error)
    }
}

impl From<eva::Error> for Error {
    fn from(error: eva::Error) -> Self {
        Self::Eva(error)
    }
}

pub type Result<T> = std::result::Result<T, Error>;
