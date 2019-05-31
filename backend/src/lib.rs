#![feature(async_await, await_macro)]

use futures::prelude::*;
use js_sys::Promise;
use wasm_bindgen::prelude::*;

use configuration::configuration;
use error::{Error, Result};

mod configuration;
pub(crate) mod console;
pub(crate) mod database;
pub(crate) mod error;
pub(crate) mod serde;

#[wasm_bindgen]
pub fn initialize() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn add_task(new_task_json: JsValue) -> Promise {
    let new_task = new_task_json
        .into_serde::<serde::NewTaskWrapper>()
        .map(|x| x.0);
    let future_added_task = async {
        let config = await!(configuration())?;
        await!(eva::add_task(&config, new_task?).map_err(Error::from))
    };
    promisify_future::<eva::Task, serde::TaskWrapper, _>(future_added_task)
}

#[wasm_bindgen]
pub fn list_tasks() -> Promise {
    let future_tasks = async {
        let config = await!(configuration())?;
        let tasks = await!(eva::tasks(&config).map_err(Error::from))?;
        Ok(tasks
            .into_iter()
            .map(serde::TaskWrapper)
            .collect::<Vec<_>>())
    };
    promisify_future::<Vec<serde::TaskWrapper>, Vec<serde::TaskWrapper>, _>(future_tasks)
}

#[wasm_bindgen]
pub fn remove_task(id: u32) -> Promise {
    let future = async move {
        let config = await!(configuration())?;
        Ok(await!(eva::delete_task(&config, id))?)
    };
    promisify_future::<(), (), _>(future)
}

#[wasm_bindgen]
pub fn schedule() -> Promise {
    let future_schedule = async {
        let config = await!(configuration())?;
        Ok(await!(eva::schedule(&config, "importance"))?)
    };
    promisify_future::<eva::Schedule<eva::Task>, serde::ScheduleWrapper, _>(future_schedule)
}

#[wasm_bindgen]
pub fn list_time_segments() -> Promise {
    let future_segments = async {
        let config = await!(configuration())?;
        let segments = await!(eva::time_segments(&config))?;
        Ok(segments
            .into_iter()
            .map(serde::TimeSegmentWrapper)
            .collect::<Vec<_>>())
    };
    promisify_future::<Vec<serde::TimeSegmentWrapper>, Vec<serde::TimeSegmentWrapper>, _>(
        future_segments,
    )
}

fn promisify_future<Item, With, F>(future: F) -> Promise
where
    With: ::serde::Serialize + From<Item>,
    F: Future<Output = Result<Item>> + 'static,
{
    wasm_bindgen_futures::futures_0_3::future_to_promise(
        future
            .and_then(|value: Item| {
                future::ready(JsValue::from_serde(&With::from(value))).err_into::<Error>()
            })
            .map_err(|error: Error| format!("{}", error).into()),
    )
}
