const API = import('@backend/eva.js');


function parseDate(timestamp) {
  return new Date(Date.parse(timestamp));
}


function parseTask(task) {
  return {
    ...task,
    deadline: parseDate(task.deadline),
  };
}


function jsApi(wasmApi) {
  wasmApi.initialize();

  return {
    addTask(task) {
      return wasmApi.add_task(task)
        .then(addedTask => parseTask(addedTask));
    },

    removeTask(id) {
      return wasmApi.remove_task(id);
    },

    listTasks() {
      return wasmApi.list_tasks()
        .then(result => result.map(parseTask));
    },

    schedule() {
      return wasmApi.schedule()
        .then(result => result.map(scheduledTask => ({
          when: parseDate(scheduledTask.when),
          task: parseTask(scheduledTask.task),
        })));
    },
  };
}


export default async function () {
  return API
    .then(jsApi)
    .catch(console.error);
}
