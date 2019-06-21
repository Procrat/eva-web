use eva::database::{Database as DatabaseT, Error, Result};
use eva::time_segment::{NamedTimeSegment as TimeSegment, NewNamedTimeSegment as NewTimeSegment};
use futures::future::LocalFutureObj;
use js_sys::Promise;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::futures_0_3::JsFuture;

use crate::serde;

macro_rules! js_await {
    ($promise:expr) => {
        await!(JsFuture::from($promise)).map_err(|error| parse_error(error))
    };
}

pub async fn database() -> crate::Result<impl DatabaseT> {
    let result = js_await!(Database::open())
        .map_err(|e| crate::Error::Database("while opening the database", e))?;
    Ok(Database::from(result))
}

#[wasm_bindgen(raw_module = "../../src/database")]
extern "C" {
    pub type Database;

    #[wasm_bindgen(static_method_of = Database)]
    pub fn open() -> Promise;

    #[wasm_bindgen(method)]
    pub fn put(database: &Database, id: u32, type_: String, document: JsValue) -> Promise;

    #[wasm_bindgen(method)]
    pub fn get(database: &Database, id: String) -> Promise;

    #[wasm_bindgen(method)]
    pub fn remove(database: &Database, document: JsValue) -> Promise;

    #[wasm_bindgen(method)]
    pub fn allTasks(database: &Database) -> Promise;

    #[wasm_bindgen(method)]
    pub fn allTasksPerTimeSegment(database: &Database) -> Promise;
}

impl DatabaseT for Database {
    fn add_task<'a: 'b, 'b>(&'a self, task: eva::NewTask) -> LocalFutureObj<'b, Result<eva::Task>> {
        // Due to a bug in wasm-bindgen, u32s larger than 2**31 turn negative in JS
        let id = rand::random::<u32>() % 2u32.pow(31);
        let future = async move {
            let serialised_task = JsValue::from_serde(&serde::NewTaskWrapper(task.clone()))
                .map_err(|e| Error("while serialising a task", e.into()))?;
            let _result = js_await!(self.put(id, "task".into(), serialised_task))
                .map_err(|e| Error("while saving a task", e))?;
            Ok(eva::Task {
                id,
                content: task.content,
                deadline: task.deadline,
                duration: task.duration,
                importance: task.importance,
                time_segment_id: task.time_segment_id,
            })
        };
        LocalFutureObj::new(Box::new(future))
    }

    fn delete_task<'a: 'b, 'b>(&'a self, id: u32) -> LocalFutureObj<'b, Result<()>> {
        let future = async move {
            let document = js_await!(self.get(format!("{}", id)))
                .map_err(|e| Error("while removing a task", e))?;
            let _result =
                js_await!(self.remove(document)).map_err(|e| Error("while removing a task", e))?;
            Ok(())
        };
        LocalFutureObj::new(Box::new(future))
    }

    fn get_task<'a: 'b, 'b>(&'a self, _id: u32) -> LocalFutureObj<'b, Result<eva::Task>> {
        unimplemented!()
    }

    fn update_task<'a: 'b, 'b>(&'a self, _task: eva::Task) -> LocalFutureObj<'b, Result<()>> {
        unimplemented!()
    }

    fn all_tasks<'a: 'b, 'b>(&'a self) -> LocalFutureObj<'b, Result<Vec<eva::Task>>> {
        let future = async move {
            let documents =
                js_await!(self.allTasks()).map_err(|e| Error("while loading all tasks", e))?;
            Ok(documents
                .into_serde::<Vec<serde::TaskWrapper>>()
                .map_err(|e| Error("while deserialising tasks", e.into()))?
                .into_iter()
                .map(|t| t.0)
                .collect())
        };
        LocalFutureObj::new(Box::new(future))
    }

    fn all_tasks_per_time_segment<'a: 'b, 'b>(
        &'a self,
    ) -> LocalFutureObj<'b, Result<Vec<(TimeSegment, Vec<eva::Task>)>>> {
        let future = async move {
            let documents = js_await!(self.allTasksPerTimeSegment())
                .map_err(|e| Error("while loading all tasks", e))?;
            let deserialised_documents: Vec<(serde::TimeSegmentWrapper, Vec<serde::TaskWrapper>)> =
                documents
                    .into_serde()
                    .map_err(|e| Error("while deserialising tasks", e.into()))?;
            Ok(deserialised_documents
                .into_iter()
                .map(|(time_segment, tasks)| {
                    (time_segment.0, tasks.into_iter().map(|t| t.0).collect())
                })
                .collect())
        };
        LocalFutureObj::new(Box::new(future))
    }

    fn add_time_segment<'a: 'b, 'b>(
        &'a self,
        time_segment: NewTimeSegment,
    ) -> LocalFutureObj<'b, Result<()>> {
        unimplemented!()
    }

    fn delete_time_segment<'a: 'b, 'b>(
        &'a self,
        time_segment: TimeSegment,
    ) -> LocalFutureObj<'b, Result<()>> {
        unimplemented!()
    }

    fn update_time_segment<'a: 'b, 'b>(
        &'a self,
        time_segment: TimeSegment,
    ) -> LocalFutureObj<'b, Result<()>> {
        unimplemented!()
    }

    fn all_time_segments<'a: 'b, 'b>(&'a self) -> LocalFutureObj<'b, Result<Vec<TimeSegment>>> {
        unimplemented!()
    }
}

fn parse_error(error: JsValue) -> failure::Error {
    let error_string: String = error
        .dyn_into::<js_sys::Object>()
        .map(|object| object.to_string().into())
        .unwrap_or("Error was not an object".into());
    failure::err_msg(error_string)
}
