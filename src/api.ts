interface NewTask {
  content: string,
  deadline: Date,
  duration: number, // in seconds
  importance: number,
  time_segment_id: number,
}

interface Task {
  id: number,
  content: string,
  deadline: Date,
  duration: number, // in seconds
  importance: number,
  time_segment_id: number,
}

interface ScheduledTask {
  taks: Task,
  when: Date,
}


function parseDate(timestamp: string): Date {
  return new Date(Date.parse(timestamp));
}


function parseTask(task: any): Task {
  return {
    ...task,
    deadline: parseDate(task.deadline),
  };
}


function jsApi(wasmApi: any) {
  wasmApi.initialize();

  return {
    async addTask(task: NewTask): Promise<Task> {
      const addedTask = await wasmApi.add_task(task);
      return parseTask(addedTask);
    },

    async removeTask(id: number) {
      return wasmApi.remove_task(id);
    },

    async listTasks(): Promise<Task[]> {
      const tasks = await wasmApi.list_tasks();
      return tasks.map(parseTask);
    },

    async schedule(): Promise<ScheduledTask[]> {
      const scheduledTasks = await wasmApi.schedule();
      return scheduledTasks.map((scheduledTask: any) => ({
        when: parseDate(scheduledTask.when),
        task: parseTask(scheduledTask.task),
      }));
    },
  };
}


export default async function () {
  return jsApi(await import('@backend/eva'));
}
