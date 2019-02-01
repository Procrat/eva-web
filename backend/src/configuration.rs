use chrono::prelude::*;
use eva::configuration;

use crate::database;
use crate::error::Result;

pub async fn configuration() -> Result<configuration::Configuration> {
    Ok(configuration::Configuration {
        database: Box::new(await!(database::database())?),
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
