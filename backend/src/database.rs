use async_trait::async_trait;
use eva::database::{Database as DatabaseT, Error, Result as EvaDbResult};
use eva::time_segment::{NamedTimeSegment as TimeSegment, NewNamedTimeSegment as NewTimeSegment};
use js_sys::Array;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

use crate::serde;

pub async fn database() -> crate::Result<impl DatabaseT> {
    let result = Database::open()
        .await
        .map_err(parse_error)
        .map_err(|e| crate::Error::Database("while opening the database", e))?;
    Ok(Database::from(result))
}

#[wasm_bindgen(raw_module = "../../src/database")]
extern "C" {
    pub type Database;

    #[wasm_bindgen(static_method_of = Database, catch)]
    pub async fn open() -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch)]
    pub async fn create(
        database: &Database,
        document: JsValue,
        type_: String,
        id: u32,
    ) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch)]
    pub async fn update(
        database: &Database,
        document: JsValue,
        type_: String,
        rev: String,
    ) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch)]
    pub async fn updateRegardlessOfRev(
        database: &Database,
        id: u32,
        document: JsValue,
        type_: String,
    ) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch)]
    pub async fn get(database: &Database, id: u32) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch)]
    pub async fn delete(
        database: &Database,
        document: JsValue,
        type_: String,
        rev: String,
    ) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch)]
    pub async fn deleteRegardlessOfRev(database: &Database, id: u32) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch)]
    pub async fn allTasks(database: &Database) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch)]
    pub async fn allTasksPerTimeSegment(database: &Database) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch)]
    pub async fn tasksForTimeSegment(
        database: &Database,
        time_segment_id: u32,
    ) -> Result<JsValue, JsValue>;

    #[wasm_bindgen(method, catch)]
    pub async fn allTimeSegments(database: &Database) -> Result<JsValue, JsValue>;
}

#[async_trait(?Send)]
impl DatabaseT for Database {
    async fn add_task(&self, task: eva::NewTask) -> EvaDbResult<eva::Task> {
        // Assert that the referenced time segment exist
        let _segment = self
            .get(task.time_segment_id)
            .await
            .map_err(parse_error)
            .map_err(|e| Error("while searching for the time segment of the new task", e))?;
        let id = rand::random();
        let serialised_task = JsValue::from_serde(&serde::NewTaskWrapper(task.clone()))
            .map_err(|e| Error("while serialising a task", e.into()))?;
        let _result = self
            .create(serialised_task, "task".into(), id)
            .await
            .map_err(parse_error)
            .map_err(|e| Error("while creating a task", e))?;
        Ok(eva::Task {
            id,
            content: task.content,
            deadline: task.deadline,
            duration: task.duration,
            importance: task.importance,
            time_segment_id: task.time_segment_id,
        })
    }

    async fn delete_task(&self, id: u32) -> EvaDbResult<()> {
        let _result = self
            .deleteRegardlessOfRev(id)
            .await
            .map_err(parse_error)
            .map_err(|e| Error("while deleting a task", e))?;
        Ok(())
    }

    async fn get_task(&self, _id: u32) -> EvaDbResult<eva::Task> {
        unimplemented!()
    }

    async fn update_task(&self, task: eva::Task) -> EvaDbResult<()> {
        // Assert that the referenced time segment exist
        let _segment = self
            .get(task.time_segment_id)
            .await
            .map_err(parse_error)
            .map_err(|e| Error("while searching for the time segment of the new task", e))?;
        let serialised_task = JsValue::from_serde(&serde::TaskWrapper(task.clone()))
            .map_err(|e| Error("while serialising a task", e.into()))?;
        let _result = self
            .updateRegardlessOfRev(task.id, serialised_task, "task".into())
            .await
            .map_err(parse_error)
            .map_err(|e| Error("while updating a task", e))?;
        Ok(())
    }

    async fn all_tasks(&self) -> EvaDbResult<Vec<eva::Task>> {
        let documents = self
            .allTasks()
            .await
            .map_err(parse_error)
            .map_err(|e| Error("while loading all tasks", e))?;
        Ok(documents
            .into_serde::<Vec<serde::TaskWrapper>>()
            .map_err(|e| Error("while deserialising tasks", e.into()))?
            .into_iter()
            .map(|t| t.0)
            .collect())
    }

    async fn all_tasks_per_time_segment(&self) -> EvaDbResult<Vec<(TimeSegment, Vec<eva::Task>)>> {
        let documents = self
            .allTasksPerTimeSegment()
            .await
            .map_err(parse_error)
            .map_err(|e| Error("while loading all tasks", e))?;
        let deserialised_documents: Vec<(serde::TimeSegmentWrapper, Vec<serde::TaskWrapper>)> =
            documents
                .into_serde()
                .map_err(|e| Error("while deserialising tasks", e.into()))?;
        Ok(deserialised_documents
            .into_iter()
            .map(|(time_segment, tasks)| (time_segment.0, tasks.into_iter().map(|t| t.0).collect()))
            .collect())
    }

    async fn add_time_segment(&self, time_segment: NewTimeSegment) -> EvaDbResult<()> {
        let id = rand::random();
        let serialised_segment = JsValue::from_serde(&serde::NewTimeSegmentWrapper(time_segment))
            .map_err(|e| Error("while serialising a time segment", e.into()));
        let _result = self
            .create(serialised_segment?, "time-segment".into(), id)
            .await
            .map_err(parse_error)
            .map_err(|e| Error("while creating a time segment", e))?;
        Ok(())
    }

    async fn delete_time_segment(&self, time_segment: TimeSegment) -> EvaDbResult<()> {
        // Assert that there are no tasks in this time segment
        let tasks: Array = self
            .tasksForTimeSegment(time_segment.id)
            .await
            .map_err(parse_error)
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
        let time_segments: Array = self
            .allTimeSegments()
            .await
            .map_err(parse_error)
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

        let _result = self
            .deleteRegardlessOfRev(time_segment.id)
            .await
            .map_err(parse_error)
            .map_err(|e| Error("while deleting a time segment", e))?;
        Ok(())
    }

    async fn update_time_segment(&self, time_segment: TimeSegment) -> EvaDbResult<()> {
        let id = time_segment.id;
        let serialised_segment = JsValue::from_serde(&serde::TimeSegmentWrapper(time_segment))
            .map_err(|e| Error("while serialising a time segment", e.into()));
        let _result = self
            .updateRegardlessOfRev(id, serialised_segment?, "time-segment".into())
            .await
            .map_err(parse_error)
            .map_err(|e| Error("while updating a time segment", e))?;
        Ok(())
    }

    async fn all_time_segments(&self) -> EvaDbResult<Vec<TimeSegment>> {
        let documents = self
            .allTimeSegments()
            .await
            .map_err(parse_error)
            .map_err(|e| Error("while loading time segments", e))?;
        Ok(documents
            .into_serde::<Vec<serde::TimeSegmentWrapper>>()
            .map_err(|e| Error("while deserialising time segments", e.into()))?
            .into_iter()
            .map(|t| t.0)
            .collect())
    }
}

fn parse_error(error: JsValue) -> failure::Error {
    let error_string: String = error
        .dyn_into::<js_sys::Object>()
        .map(|object| object.to_string().into())
        .unwrap_or("Error was not an object".into());
    failure::err_msg(error_string)
}
