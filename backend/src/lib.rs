#![feature(try_blocks)]

use wasm_bindgen::prelude::*;

use configuration::configuration;
use error::{Error, Result};

mod configuration;
pub(crate) mod console;
pub(crate) mod database;
pub(crate) mod error;
pub(crate) mod serde;

#[wasm_bindgen]
pub async fn initialize() -> Result<()> {
    console_error_panic_hook::set_once();
    configuration::init_configuration().await
}

#[wasm_bindgen]
pub async fn add_task(new_task_json: JsValue) -> Result<JsValue> {
    let new_task = deserialise::<eva::NewTask, serde::NewTaskWrapper>(new_task_json)?;
    let added_task = eva::add_task(configuration()?, new_task).await?;
    serialise::<eva::Task, serde::TaskWrapper>(added_task)
}

#[wasm_bindgen]
pub async fn remove_task(id: u32) -> Result<()> {
    Ok(eva::delete_task(configuration()?, id).await?)
}

#[wasm_bindgen]
pub async fn list_tasks() -> Result<JsValue> {
    let tasks = eva::tasks(configuration()?)
        .await?
        .into_iter()
        .map(serde::TaskWrapper)
        .collect::<Vec<_>>();
    serialise::<Vec<serde::TaskWrapper>, Vec<serde::TaskWrapper>>(tasks)
}

#[wasm_bindgen]
pub async fn schedule() -> Result<JsValue> {
    let schedule = eva::schedule(configuration()?, "importance").await?;
    serialise::<eva::Schedule<eva::Task>, serde::ScheduleWrapper>(schedule)
}

#[wasm_bindgen]
pub async fn add_time_segment(new_segment_json: JsValue) -> Result<()> {
    let new_segment = deserialise::<
        eva::time_segment::NewNamedTimeSegment,
        serde::NewTimeSegmentWrapper,
    >(new_segment_json)?;
    Ok(eva::add_time_segment(configuration()?, new_segment).await?)
}

#[wasm_bindgen]
pub async fn delete_time_segment(segment_json: JsValue) -> Result<()> {
    let segment = deserialise::<eva::time_segment::NamedTimeSegment, serde::TimeSegmentWrapper>(
        segment_json,
    )?;
    Ok(eva::delete_time_segment(configuration()?, segment).await?)
}

#[wasm_bindgen]
pub async fn update_time_segment(segment_json: JsValue) -> Result<()> {
    let segment = deserialise::<eva::time_segment::NamedTimeSegment, serde::TimeSegmentWrapper>(
        segment_json,
    )?;
    Ok(eva::update_time_segment(configuration()?, segment).await?)
}

#[wasm_bindgen]
pub async fn list_time_segments() -> Result<JsValue> {
    let segments = eva::time_segments(configuration()?)
        .await?
        .into_iter()
        .map(serde::TimeSegmentWrapper)
        .collect::<Vec<_>>();
    serialise::<Vec<serde::TimeSegmentWrapper>, Vec<serde::TimeSegmentWrapper>>(segments)
}

fn deserialise<Item, With>(item: JsValue) -> Result<Item>
where
    With: for<'a> ::serde::Deserialize<'a> + Into<Item>,
{
    Ok(item.into_serde::<With>()?.into())
}

fn serialise<Item, With>(item: Item) -> Result<JsValue>
where
    With: ::serde::Serialize + From<Item>,
{
    JsValue::from_serde(&With::from(item)).map_err(|e| e.into())
}
