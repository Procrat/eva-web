use std::ops::Range;

use ::serde::{Deserialize, Serialize};
use chrono::prelude::*;
use chrono::Duration;
use derive_more::From;

#[derive(Debug, Serialize, Deserialize, From)]
pub struct NewTaskWrapper(#[serde(with = "NewTask")] pub eva::NewTask);

#[derive(Debug, Serialize, Deserialize)]
#[serde(remote = "eva::NewTask")]
struct NewTask {
    content: String,
    deadline: DateTime<Utc>,
    #[serde(with = "duration_in_seconds")]
    duration: Duration,
    importance: u32,
    time_segment_id: u32,
}

#[derive(Debug, Serialize, Deserialize, From)]
pub struct TaskWrapper(#[serde(with = "Task")] pub eva::Task);

#[derive(Debug, Serialize, Deserialize)]
#[serde(remote = "eva::Task")]
struct Task {
    #[serde(with = "id", alias = "_id")]
    id: u32,
    content: String,
    deadline: DateTime<Utc>,
    #[serde(with = "duration_in_seconds")]
    duration: Duration,
    importance: u32,
    time_segment_id: u32,
}

#[derive(Debug, Serialize, From)]
pub struct ScheduleWrapper(#[serde(with = "Schedule")] pub eva::Schedule<eva::Task>);

#[derive(Debug, Serialize)]
#[serde(remote = "eva::Schedule<eva::Task>")]
struct Schedule(#[serde(with = "scheduled_task_vec")] Vec<eva::Scheduled<eva::Task>>);

mod scheduled_task_vec {
    use super::ScheduledTaskWrapper;
    use serde::ser::{SerializeSeq, Serializer};

    pub fn serialize<S>(
        tasks: &Vec<eva::Scheduled<eva::Task>>,
        serializer: S,
    ) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let mut seq = serializer.serialize_seq(Some(tasks.len()))?;
        for task in tasks {
            seq.serialize_element(&ScheduledTaskWrapper(task))?;
        }
        seq.end()
    }
}

#[derive(Debug, Serialize, From)]
struct ScheduledTaskWrapper<'a>(#[serde(with = "ScheduledTask")] &'a eva::Scheduled<eva::Task>);

#[derive(Debug, Serialize)]
#[serde(remote = "eva::Scheduled<eva::Task>")]
struct ScheduledTask {
    #[serde(with = "Task")]
    task: eva::Task,
    when: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct TimeSegmentWrapper(
    #[serde(with = "TimeSegment")] pub eva::time_segment::NamedTimeSegment,
);

#[derive(Debug, Deserialize)]
#[serde(remote = "eva::time_segment::NamedTimeSegment")]
struct TimeSegment {
    #[serde(with = "id", alias = "_id")]
    id: u32,
    name: String,
    ranges: Vec<Range<DateTime<Utc>>>,
    start: DateTime<Utc>,
    #[serde(with = "duration_in_seconds")]
    period: Duration,
}

mod id {
    use serde::de::Error;
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S>(id: &u32, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u32(*id)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<u32, D::Error>
    where
        D: Deserializer<'de>,
    {
        // If the object comes from the front-end, the id will be a number;
        // If it comes from the database, the id will be a string.
        #[derive(Deserialize)]
        #[serde(untagged)]
        enum Id {
            Integer(u32),
            String(String),
        }

        let id = Id::deserialize(deserializer)?;
        match id {
            Id::Integer(id) => Ok(id),
            Id::String(string) => string.parse().map_err(Error::custom),
        }
    }
}

mod duration_in_seconds {
    use chrono::Duration;
    use serde::{Deserialize, Deserializer, Serializer};

    pub fn serialize<S>(duration: &Duration, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u32(duration.num_seconds() as u32)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<Duration, D::Error>
    where
        D: Deserializer<'de>,
    {
        let duration_seconds = u32::deserialize(deserializer)?;
        Ok(Duration::seconds(i64::from(duration_seconds)))
    }
}
