use std::borrow::Cow;

use anyhow::{Error, Result};
use chrono::prelude::*;
use eva::configuration;

use crate::database;

static mut CONFIG: std::result::Result<configuration::Configuration, Cow<'static, str>> = Err(
    Cow::Borrowed("An unexpected error happened: The configuration isn't initialised yet"),
);

pub async fn init_configuration() -> Result<()> {
    match new_configuration().await {
        Ok(config_) => {
            unsafe { CONFIG = Ok(config_) };
            Ok(())
        }
        Err(error) => {
            unsafe { CONFIG = Err(Cow::from(error.to_string())) };
            Err(error)
        }
    }
}

pub fn configuration() -> Result<&'static configuration::Configuration> {
    match unsafe { &CONFIG } {
        Ok(config) => Ok(config),
        Err(error) => Err(Error::msg(error)),
    }
}

async fn new_configuration() -> Result<configuration::Configuration> {
    let database = database::database().await?;
    Ok(configuration::Configuration {
        database: Box::new(database),
        scheduling_strategy: configuration::SchedulingStrategy::Importance,
        time_context: Box::new(time_context()),
    })
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
