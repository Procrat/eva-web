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
    async addTask(task) {
      const addedTask = await wasmApi.add_task(task);
      return parseTask(addedTask);
    },

    async removeTask(id) {
      return wasmApi.remove_task(id);
    },

    async listTasks() {
      const tasks = await wasmApi.list_tasks();
      return tasks.map(parseTask);
    },

    async schedule() {
      const scheduledTasks = await wasmApi.schedule();
      return scheduledTasks.map(scheduledTask => ({
        when: parseDate(scheduledTask.when),
        task: parseTask(scheduledTask.task),
      }));
    },
  };
}


export default async function () {
  return API
    .then(jsApi)
    .catch(console.error);
}
