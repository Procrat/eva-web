#![feature(link_args)]

extern crate chrono;
#[macro_use]
extern crate error_chain;
extern crate eva;
extern crate serde;
extern crate serde_json;
#[macro_use]
extern crate serde_derive;


use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::time::Duration;

use chrono::{DateTime, Local};

use errors::Result;

#[allow(unused_doc_comment)]
mod errors {
    error_chain! {
        foreign_links {
            Serialisation(::serde_json::Error);
            Eva(::eva::Error);
        }
    }
}

#[cfg_attr(target_arch="asmjs", link_args="-s INVOKE_RUN=0")]
extern {}


fn main() {}

#[no_mangle]
pub extern fn schedule() -> *mut c_char {
    let schedule = (|| {
        let schedule = eva::schedule(&configuration(), "importance")?;
        Ok(Schedule::new(schedule))
    })();

    let serialised = jsonify_result(schedule).unwrap();
    string_to_cstr(&serialised)
}

#[no_mangle]
pub extern fn add_task(new_task_json: *mut c_char) -> *mut c_char {
    let new_task_json = cstr_to_string(&new_task_json);
    let result = (|| {
        let new_task: NewTask = serde_json::from_str(&new_task_json)?;
        Ok(eva::add(&configuration(), &new_task.content, new_task.deadline,
                    Duration::from_secs((new_task.duration_minutes * 60) as u64),
                    new_task.importance)?)
    })();

    let serialised = jsonify_result(result).unwrap();
    string_to_cstr(&serialised)
}

#[no_mangle]
pub extern fn list_tasks() -> *mut c_char {
    let result = (|| {
        let tasks = eva::list_tasks(&configuration())?;
        Ok(tasks.into_iter().map(Task::new).collect::<Vec<_>>())
    })();

    let serialised = jsonify_result(result).unwrap();
    string_to_cstr(&serialised)
}

#[no_mangle]
pub extern fn remove_task(id: u32) -> *mut c_char {
    let result = (|| {
        Ok(eva::remove(&configuration(), id)?)
    })();

    let serialised = jsonify_result(result).unwrap();
    string_to_cstr(&serialised)
}

fn configuration() -> eva::configuration::Configuration {
    eva::configuration::Configuration {
        database_path: "/indexed_db/db.sqlite".to_owned(),
        scheduling_strategy: eva::configuration::SchedulingStrategy::Importance,
    }
}


#[derive(Debug, Deserialize)]
struct NewTask {
    content: String,
    deadline: DateTime<Local>,
    duration_minutes: u32,
    importance: u32,
}

#[derive(Debug, Serialize)]
struct Task {
    id: u32,
    content: String,
    deadline: String,
    duration_minutes: i64,
    importance: u32,
}

#[derive(Debug, Serialize)]
struct Schedule(Vec<ScheduledTask>);

#[derive(Debug, Serialize)]
struct ScheduledTask {
    task: Task,
    when: String,
}

#[derive(Debug, Serialize)]
struct ErrorStruct {
    error: String,
}

impl Task {
    fn new(task: eva::Task) -> Self {
        Task {
            id: task.id.unwrap(),
            content: task.content,
            deadline: format!("{}", task.deadline),
            duration_minutes: task.duration.num_minutes(),
            importance: task.importance,
        }
    }
}

impl Schedule {
    fn new(schedule: eva::Schedule) -> Self {
         Schedule(schedule.0.into_iter().map(ScheduledTask::new).collect())
    }
}

impl ScheduledTask {
    fn new(scheduled_task: eva::ScheduledTask) -> Self {
        ScheduledTask {
            task: Task::new(scheduled_task.task),
            when: format!("{}", scheduled_task.when),
        }
    }
}


fn jsonify_result<T>(result: Result<T>) -> Result<String>
    where T: serde::Serialize
{
    match result {
        Ok(jsonifiable) => Ok(serde_json::to_string(&jsonifiable)?),
        Err(error) => {
            let chain = error.iter().skip(1)
                .map(|x| x.to_string())
                .collect::<Vec<String>>()
                .join(". ");

            let message = if chain.is_empty() {
                format!("{}.", error)
            } else {
                format!("{}. ({})", error, chain)
            };

            Ok(serde_json::to_string(&ErrorStruct { error: message })?)
        },
    }
}

fn cstr_to_string(c_string: &*mut c_char) -> String {
    unsafe {
        CStr::from_ptr(*c_string).to_string_lossy().into_owned()
    }
}

fn string_to_cstr(string: &str) -> *mut c_char {
    CString::new(string).unwrap().into_raw()
}
