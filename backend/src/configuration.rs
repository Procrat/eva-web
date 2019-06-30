use chrono::prelude::*;
use eva::configuration;

use crate::database;
use crate::error::{Error, Result};

static mut CONFIG: Option<configuration::Configuration> = None;
static mut CONFIG_ERR: Option<Error> = None;

pub async fn init_configuration() -> Result<()> {
    let result = try {
        configuration::Configuration {
            database: Box::new(await!(database::database())?),
            scheduling_strategy: configuration::SchedulingStrategy::Importance,
            time_context: Box::new(time_context()),
        }
    };
    unsafe {
        match result {
            Ok(config_) => {
                CONFIG = Some(config_);
                Ok(())
            }
            Err(error) => {
                CONFIG_ERR = Some(Error::Configuration(Error::to_string(&error)));
                Err(error)
            }
        }
    }
}

pub fn configuration() -> Result<&'static configuration::Configuration> {
    unsafe {
        match (&CONFIG, &CONFIG_ERR) {
            (Some(config_), _) => Ok(&config_),
            (_, Some(config_err_)) => Err(Error::Configuration(config_err_.to_string())),
            (_, _) => Err(Error::Configuration(
                "Internal error: configuration not initialized.".into(),
            )),
        }
    }
}

struct JsTimeContext;

impl configuration::TimeContext for JsTimeContext {
    fn now(&self) -> DateTime<Utc> {
        let ms_since_epoch = js_sys::Date::now();
        Utc.timestamp(
            (ms_since_epoch / 1000.0) as i64,
            ((ms_since_epoch % 1000.0) * 1000000.0) as u32,
        )
    }
}

fn time_context() -> impl configuration::TimeContext {
    JsTimeContext
}
