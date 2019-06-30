#![feature(async_await, await_macro)]
#![feature(try_blocks)]

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
pub fn initialize() -> Promise {
    console_error_panic_hook::set_once();
    promisify_future::<(), (), _>(configuration::init_configuration())
}

#[wasm_bindgen]
pub fn add_task(new_task_json: JsValue) -> Promise {
    let new_task = new_task_json
        .into_serde::<serde::NewTaskWrapper>()
        .map(|x| x.0);
    let future_added_task = async {
        Ok(await!(eva::add_task(configuration()?, new_task?))?)
    };
    promisify_future::<eva::Task, serde::TaskWrapper, _>(future_added_task)
}

#[wasm_bindgen]
pub fn remove_task(id: u32) -> Promise {
    let future = async move {
        Ok(await!(eva::delete_task(configuration()?, id))?)
    };
    promisify_future::<(), (), _>(future)
}

#[wasm_bindgen]
pub fn list_tasks() -> Promise {
    let future_tasks = async {
        let tasks = await!(eva::tasks(configuration()?))?;
        Ok(tasks
            .into_iter()
            .map(serde::TaskWrapper)
            .collect::<Vec<_>>())
    };
    promisify_future::<Vec<serde::TaskWrapper>, Vec<serde::TaskWrapper>, _>(future_tasks)
}

#[wasm_bindgen]
pub fn schedule() -> Promise {
    let future_schedule = async {
        Ok(await!(eva::schedule(configuration()?, "importance"))?)
    };
    promisify_future::<eva::Schedule<eva::Task>, serde::ScheduleWrapper, _>(future_schedule)
}

#[wasm_bindgen]
pub fn add_time_segment(new_segment_json: JsValue) -> Promise {
    let new_segment = new_segment_json
        .into_serde::<serde::NewTimeSegmentWrapper>()
        .map(|x| x.0);
    let future = async {
        Ok(await!(eva::add_time_segment(configuration()?, new_segment?))?)
    };
    promisify_future::<(), (), _>(future)
}

#[wasm_bindgen]
pub fn delete_time_segment(segment_json: JsValue) -> Promise {
    let segment = segment_json
        .into_serde::<serde::TimeSegmentWrapper>()
        .map(|x| x.0);
    let future = async {
        Ok(await!(eva::delete_time_segment(configuration()?, segment?))?)
    };
    promisify_future::<(), (), _>(future)
}

#[wasm_bindgen]
pub fn update_time_segment(segment_json: JsValue) -> Promise {
    let segment = segment_json
        .into_serde::<serde::TimeSegmentWrapper>()
        .map(|x| x.0);
    let future = async {
        Ok(await!(eva::update_time_segment(configuration()?, segment?))?)
    };
    promisify_future::<(), (), _>(future)
}

#[wasm_bindgen]
pub fn list_time_segments() -> Promise {
    let future_segments = async {
        let segments = await!(eva::time_segments(configuration()?))?;
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
