#![feature(futures_api)]
#![feature(async_await, await_macro)]

#[macro_use]
extern crate error_chain;

use std::convert::Into;

use chrono::prelude::*;
use chrono::Duration;
use js_sys::Promise;
use futures::prelude::*;
use futures::future::Future;
use serde_derive::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::future_to_promise;

use crate::errors::{Error, Result};


mod errors {
    error_chain! {
        foreign_links {
            Serialisation(::serde_json::Error);
            Eva(::eva::Error);
        }
    }
}

pub mod database;

pub mod console {
    use js_sys::JSON;
    use wasm_bindgen::prelude::*;

    pub fn log(obj: &JsValue) {
        web_sys::console::log_1(&JSON::stringify(obj).unwrap().into())
    }

    pub fn error(obj: &JsValue) {
        web_sys::console::error_1(&JSON::stringify(obj).unwrap().into())
    }
}


#[wasm_bindgen]
pub fn initialize() {
    console_error_panic_hook::set_once();
}


#[wasm_bindgen]
pub fn add_task(new_task_json: JsValue) -> Promise {
    let new_task = deserialise_json::<NewTask, eva::NewTask>(&new_task_json);
    let future_added_task = async {
        let config = configuration();
        await!(eva::add(&config, new_task?).map_err(Error::from))
    };
    promisify_future::<eva::Task, Task, _, _>(future_added_task)
}


#[wasm_bindgen]
pub fn list_tasks() -> Promise {
    let future_tasks = async {
        let config = configuration();
        let tasks = await!(eva::all(&config).map_err(Error::from))?;
        Ok(tasks.into_iter().map(Task::from).collect::<Vec<_>>())
    };
    promisify_future::<Vec<Task>, Vec<Task>, _, Error>(future_tasks)
}


#[wasm_bindgen]
pub fn remove_task(id: u32) -> Promise {
    let future = async move {
        let config = configuration();
        await!(eva::remove(&config, id))
    };
    promisify_future::<(), (), _, _>(future)
}


#[wasm_bindgen]
pub fn schedule() -> Promise {
    let future_schedule = async {
        let config = configuration();
        await!(eva::schedule(&config, "importance"))
    };
    promisify_future::<eva::Schedule, Schedule, _, _>(future_schedule)
}


fn configuration() -> eva::configuration::Configuration {
    eva::configuration::Configuration {
        database: Box::new(database::database()),
        scheduling_strategy: eva::configuration::SchedulingStrategy::Importance,
        time_context: Box::new(time_context()),
    }
}


struct JsTimeContext;

impl eva::configuration::TimeContext for JsTimeContext {
    fn now(&self) -> DateTime<Utc> {
        let ms_since_epoch = js_sys::Date::now();
        Utc.timestamp((ms_since_epoch / 1000.0) as i64,
                      ((ms_since_epoch % 1000.0) * 1000000.0) as u32)
    }
}

fn time_context() -> impl eva::configuration::TimeContext {
    JsTimeContext
}


#[derive(Debug, Deserialize)]
pub struct NewTask {
    content: String,
    deadline: DateTime<Utc>,
    duration_minutes: u32,
    importance: u32,
}


impl From<NewTask> for eva::NewTask {
    fn from(new_task: NewTask) -> eva::NewTask {
        eva::NewTask {
            content: new_task.content,
            deadline: new_task.deadline,
            duration: Duration::minutes(new_task.duration_minutes as i64),
            importance: new_task.importance,
        }
    }
}


#[derive(Debug, Serialize)]
struct Task {
    id: u32,
    content: String,
    deadline: DateTime<Utc>,
    duration_minutes: i64,
    importance: u32,
}

impl From<eva::Task> for Task {
    fn from(task: eva::Task) -> Task {
        Task {
            id: task.id,
            content: task.content,
            deadline: task.deadline,
            duration_minutes: task.duration.num_minutes(),
            importance: task.importance,
        }
    }
}


#[derive(Debug, Serialize)]
struct Schedule(Vec<ScheduledTask>);

#[derive(Debug, Serialize)]
struct ScheduledTask {
    task: Task,
    when: DateTime<Utc>,
}

impl From<eva::Schedule> for Schedule {
    fn from(schedule: eva::Schedule) -> Schedule {
        Schedule(schedule.0.into_iter().map(Into::into).collect())
    }
}

impl From<eva::ScheduledTask> for ScheduledTask {
    fn from(scheduled_task: eva::ScheduledTask) -> ScheduledTask {
        ScheduledTask {
            task: Task::from(scheduled_task.task),
            when: scheduled_task.when,
        }
    }
}


fn deserialise_json<With, To>(json: &JsValue) -> Result<To>
where
    for<'a> With: serde::Deserialize<'a>,
    To: From<With>,
{
    let intermediate: With = json.into_serde()?;
    Ok(To::from(intermediate))
}


fn promisify_future<Item, With, F, E>(future: F) -> Promise
where
    With: serde::Serialize,
    With: From<Item>,
    F: Future<Output=std::result::Result<Item, E>> + 'static,
    Error: From<E>,
{
    future_to_promise(
        future
            .err_into::<Error>()
            .and_then(|value: Item| {
                future::ready(JsValue::from_serde::<With>(&With::from(value)))
                    .err_into::<Error>()
            })
            .map_err(|error: Error| format_error(error).into())
            .boxed()
            .compat()
    )
}


fn format_error(error: Error) -> String {
    let chain = error.iter().skip(1)
        .map(|x| x.to_string())
        .collect::<Vec<String>>()
        .join(". ");

    if chain.is_empty() {
        format!("{}.", error)
    } else {
        format!("{}. ({})", error, chain)
    }
}
