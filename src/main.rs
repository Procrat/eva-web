#![feature(link_args)]

extern crate eva;
extern crate serde;
extern crate serde_json;
#[macro_use]
extern crate serde_derive;


use std::ffi::{CStr, CString};
use std::os::raw::c_char;

use eva::Result;
use eva::configuration;
use eva::configuration::{Configuration};

#[cfg_attr(target_arch="asmjs", link_args="-s INVOKE_RUN=0")]
extern {}

fn main() {}

#[no_mangle]
pub extern fn print_schedule() -> *mut c_char {
    let result = eva::print_schedule(&configuration(), "importance");

    let serialised = jsonify_result(result).unwrap();
    string_to_cstr(&serialised)
}

#[no_mangle]
pub extern fn add_task(new_task_json: *mut c_char) -> *mut c_char {
    let new_task_json = cstr_to_string(&new_task_json);
    let new_task: NewTask = serde_json::from_str(&new_task_json).unwrap();

    let result = eva::add(&configuration(), &new_task.content, &new_task.deadline,
                          &new_task.duration, new_task.importance);

    let serialised = jsonify_result(result).unwrap();
    string_to_cstr(&serialised)
}

#[no_mangle]
pub extern fn list_tasks() -> *mut c_char {
    let result = eva::list_tasks(&configuration())
        .map(|tasks| {
            tasks.into_iter().map(|task| {
                Task {
                    content: task.content,
                    deadline: format!("{}", task.deadline),
                    duration_minutes: task.duration.num_minutes(),
                    importance: task.importance,
                }
            }).collect::<Vec<_>>()
        });

    let serialised = jsonify_result(result).unwrap();
    string_to_cstr(&serialised)
}

fn configuration() -> Configuration {
    Configuration {
        database_path: "/indexed_db/db.sqlite".to_owned(),
        scheduling_strategy: configuration::SchedulingStrategy::Importance,
    }
}


#[derive(Debug, Deserialize)]
struct NewTask {
    content: String,
    deadline: String,
    duration: String,
    importance: u32,
}

#[derive(Debug, Serialize)]
struct Task {
    content: String,
    deadline: String,
    duration_minutes: i64,
    importance: u32,
}

#[derive(Debug, Serialize)]
struct Error {
    error: String,
}


fn jsonify_result<T>(result: Result<T>) -> serde_json::Result<String>
    where T: serde::Serialize
{
    match result {
        Ok(jsonifiable) => serde_json::to_string(&jsonifiable),
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

            serde_json::to_string(&Error { error: message })
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
