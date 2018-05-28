use chrono::Duration;
use chrono::prelude::*;
use eva::errors::*;
use futures::compat::Future01CompatExt;
use futures::future::LocalFutureObj;
use js_sys::Promise;
use serde_derive::Deserialize;
use serde_json::json;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use wasm_bindgen_futures::JsFuture;


pub fn database() -> impl eva::database::Database {
    PouchDB::new("tasks")
}


#[wasm_bindgen(module = "./../../src/pouchdb")]
pub extern {
    pub type PouchDB;

    #[wasm_bindgen(constructor)]
    pub fn new(database_name: &str) -> PouchDB;

    #[wasm_bindgen(method)]
    pub fn put(database: &PouchDB, object: JsValue) -> Promise;

    #[wasm_bindgen(method)]
    pub fn get(database: &PouchDB, id: String) -> Promise;

    #[wasm_bindgen(method)]
    pub fn remove(database: &PouchDB, doc: JsValue) -> Promise;

    #[wasm_bindgen(method)]
    pub fn allDocs(datbase: &PouchDB, options: JsValue) -> Promise;
}


impl eva::database::Database for PouchDB {
    fn add_task<'a: 'b, 'b>(&'a self, task: eva::NewTask) -> LocalFutureObj<'b, eva::Result<eva::Task>> {
        let id: u32 = rand::random();
        let db_task = json!({
            "_id": format!("{}", id),
            "content": task.content,
            "deadline": task.deadline.timestamp(),
            "duration": task.duration.num_seconds(),
            "importance": task.importance,
        });
        let future = async move {
            let serialised_task = JsValue::from_serde(&db_task)
                .chain_err(|| ErrorKind::Database(
                    "while trying to serialise a task".into()))?;
            let result = await!(JsFuture::from(self.put(serialised_task)).compat())
                .map_err(|error| chained_database_error(error, "while trying to save a task"))?;
            if get_property_unsafe(&result, "ok") != JsValue::TRUE {
                return Err(chained_database_error(result, "while trying to save a task"));
            }
            Ok(eva::Task {
                id: id,
                content: task.content,
                deadline: task.deadline,
                duration: task.duration,
                importance: task.importance,
            })
        };
        LocalFutureObj::new(Box::new(future))
    }

    fn remove_task<'a: 'b, 'b>(&'a self, id: u32) -> LocalFutureObj<'b, eva::Result<()>> {
        let future = async move {
            let doc = await!(JsFuture::from(self.get(format!("{}", id))).compat())
                .map_err(|error| chained_database_error(error, "while trying to remove a task"))?;
            let _result = await!(JsFuture::from(self.remove(doc)).compat())
                .map_err(|error| chained_database_error(error, "while trying to remove a task"))?;
            Ok(())
        };
        LocalFutureObj::new(Box::new(future))
    }

    fn find_task<'a: 'b, 'b>(&'a self, _id: u32) -> LocalFutureObj<'b, eva::Result<eva::Task>> {
        unimplemented!()
    }

    fn update_task<'a: 'b, 'b>(&'a self, _task: eva::Task) -> LocalFutureObj<'b, eva::Result<()>> {
        unimplemented!()
    }

    fn all_tasks<'a: 'b, 'b>(&'a self) -> LocalFutureObj<'b, eva::Result<Vec<eva::Task>>> {
        let options = json!({
            "include_docs": true,
        });
        let serialised_options =
            JsValue::from_serde(&options)
            .chain_err(|| ErrorKind::Database(
                "while trying to talk to the database".into()));
        let future = async move {
            let result = await!(JsFuture::from(self.allDocs(serialised_options?)).compat())
                .map_err(|error| chained_database_error(error, "while trying to load all tasks"))?;
            let rows: js_sys::Array = get_property_unsafe(&result, "rows").into();
            let docs: JsValue = rows.map(&mut |row, _, _| get_property_unsafe(&row, "doc")).into();
            let deserialised_result: Vec<Task> = docs.into_serde()
                .chain_err(|| ErrorKind::Database(
                    "while trying to load all tasks".into()))?;
            Ok(deserialised_result.into_iter()
               .map(|task: Task| -> eva::Task {
                   let naive_deadline = NaiveDateTime::from_timestamp(i64::from(task.deadline), 0);
                   let deadline = Utc.from_utc_datetime(&naive_deadline);
                   let duration = Duration::seconds(i64::from(task.duration));
                   eva::Task {
                       id: task._id.parse::<u32>().unwrap(),
                       content: task.content,
                       deadline: deadline,
                       duration: duration,
                       importance: task.importance,
                   }
               }).collect())
        };
        LocalFutureObj::new(Box::new(future))
    }
}


fn get_property_unsafe(object: &JsValue, property_name: &str) -> JsValue {
    js_sys::Reflect::get(object, &property_name.into()).unwrap()
}


fn js_to_rust_error(rejection_value: JsValue) -> Error {
    let error_string: String = rejection_value
        .dyn_into::<js_sys::Object>()
        .map(|object| object.to_string().into())
        .unwrap_or("Error was not an object".into());
    Error::from(ErrorKind::from(error_string))
}

fn chained_database_error(rejection_value: JsValue, message: &str) -> Error {
    Error::with_chain(js_to_rust_error(rejection_value),
                      ErrorKind::Database(message.into()))
}


#[derive(Deserialize)]
struct Task {
    _id: String,
    _rev: String,
    content: String,
    deadline: u32,
    duration: u32,
    importance: u32,
}
