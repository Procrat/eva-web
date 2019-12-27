use eva::database::{Database as DatabaseT, Error, Result};
use eva::time_segment::{NamedTimeSegment as TimeSegment, NewNamedTimeSegment as NewTimeSegment};
use futures::future::LocalFutureObj;
use js_sys::{Array, Promise};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::JsFuture;

use crate::serde;

macro_rules! js_await {
    ($promise:expr) => {
        JsFuture::from($promise).await.map_err(parse_error)
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
    pub fn create(database: &Database, document: JsValue, type_: String, id: u32) -> Promise;

    #[wasm_bindgen(method)]
    pub fn update(database: &Database, document: JsValue, type_: String, rev: String) -> Promise;

    #[wasm_bindgen(method)]
    pub fn updateRegardlessOfRev(
        database: &Database,
        id: u32,
        document: JsValue,
        type_: String,
    ) -> Promise;

    #[wasm_bindgen(method)]
    pub fn get(database: &Database, id: u32) -> Promise;

    #[wasm_bindgen(method)]
    pub fn delete(database: &Database, document: JsValue, type_: String, rev: String) -> Promise;

    #[wasm_bindgen(method)]
    pub fn deleteRegardlessOfRev(database: &Database, id: u32) -> Promise;

    #[wasm_bindgen(method)]
    pub fn allTasks(database: &Database) -> Promise;

    #[wasm_bindgen(method)]
    pub fn allTasksPerTimeSegment(database: &Database) -> Promise;

    #[wasm_bindgen(method)]
    pub fn tasksForTimeSegment(database: &Database, time_segment_id: u32) -> Promise;

    #[wasm_bindgen(method)]
    pub fn allTimeSegments(database: &Database) -> Promise;
}

impl DatabaseT for Database {
    fn add_task<'a: 'b, 'b>(&'a self, task: eva::NewTask) -> LocalFutureObj<'b, Result<eva::Task>> {
        let future = async move {
            // Assert that the referenced time segment exist
            let _segment = js_await!(self.get(task.time_segment_id))
                .map_err(|e| Error("while searching for the time segment of the new task", e))?;
            let id = rand::random();
            let serialised_task = JsValue::from_serde(&serde::NewTaskWrapper(task.clone()))
                .map_err(|e| Error("while serialising a task", e.into()))?;
            let _result = js_await!(self.create(serialised_task, "task".into(), id))
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
            let _result = js_await!(self.deleteRegardlessOfRev(id))
                .map_err(|e| Error("while deleting a task", e))?;
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
        let id = rand::random();
        let serialised_segment = JsValue::from_serde(&serde::NewTimeSegmentWrapper(time_segment))
            .map_err(|e| Error("while serialising a time segment", e.into()));
        let future = async move {
            let _result = js_await!(self.create(serialised_segment?, "time-segment".into(), id))
                .map_err(|e| Error("while saving a time segment", e))?;
            Ok(())
        };
        LocalFutureObj::new(Box::new(future))
    }

    fn delete_time_segment<'a: 'b, 'b>(
        &'a self,
        time_segment: TimeSegment,
    ) -> LocalFutureObj<'b, Result<()>> {
        let future = async move {
            // Assert that there are no tasks in this time segment
            let tasks: Array = js_await!(self.tasksForTimeSegment(time_segment.id))
                .map_err(|e| Error("while fetching tasks for a time segment", e))?
                .into();
            if tasks.length() > 0 {
                Err(Error(
                    "while deleting a time segment",
                    failure::format_err!(
                        "There {} in this time segment. Please delete them or move them to \
                         another segment before deleting this segment.",
                        if tasks.length() == 1 {
                            "is still a task".to_string()
                        } else {
                            format!("are still {} tasks", tasks.length())
                        },
                    ),
                ))?;
            }

            // Assert that this isn't the last time segment
            let time_segments: Array = js_await!(self.allTimeSegments())
                .map_err(|e| Error("while deleting a time segments", e))?
                .into();
            if time_segments.length() <= 1 {
                Err(Error(
                    "while trying to delete a time segment",
                    failure::format_err!(
                        "If you remove the last time segment, when should I schedule things?"
                    ),
                ))?
            }

            let _result = js_await!(self.deleteRegardlessOfRev(time_segment.id))
                .map_err(|e| Error("while deleting a time segment", e))?;
            Ok(())
        };
        LocalFutureObj::new(Box::new(future))
    }

    fn update_time_segment<'a: 'b, 'b>(
        &'a self,
        time_segment: TimeSegment,
    ) -> LocalFutureObj<'b, Result<()>> {
        let id = time_segment.id;
        let serialised_segment = JsValue::from_serde(&serde::TimeSegmentWrapper(time_segment))
            .map_err(|e| Error("while serialising a time segment", e.into()));
        let future = async move {
            let _result = js_await!(self.updateRegardlessOfRev(
                id,
                serialised_segment?,
                "time-segment".into()
            ))
            .map_err(|e| Error("while updating a time segment", e))?;
            Ok(())
        };
        LocalFutureObj::new(Box::new(future))
    }

    fn all_time_segments<'a: 'b, 'b>(&'a self) -> LocalFutureObj<'b, Result<Vec<TimeSegment>>> {
        let future_time_segments = async move {
            let documents = js_await!(self.allTimeSegments())
                .map_err(|e| Error("while loading time segments", e))?;
            Ok(documents
                .into_serde::<Vec<serde::TimeSegmentWrapper>>()
                .map_err(|e| Error("while deserialising time segments", e.into()))?
                .into_iter()
                .map(|t| t.0)
                .collect())
        };
        LocalFutureObj::new(Box::new(future_time_segments))
    }
}

fn parse_error(error: JsValue) -> failure::Error {
    let error_string: String = error
        .dyn_into::<js_sys::Object>()
        .map(|object| object.to_string().into())
        .unwrap_or("Error was not an object".into());
    failure::err_msg(error_string)
}
