import Color from 'color';

const API = import('@backend/eva.js');


export class TimeSegment {
  constructor(id, name, start, ranges, period) {
    this.id = id;
    this.name = name;
    this.start = start;
    this.ranges = ranges;
    this.period = period;
    this.uniqueId = `${this.name}:${this.id || new Date().getTime()}`;
    // TODO make colors persistent
    this.color = new Color({ h: Math.floor(Math.random() * 361), s: 100, l: 80 });
  }
}


function parseDate(timestamp) {
  return new Date(Date.parse(timestamp));
}


function parseTask(task) {
  return {
    ...task,
    deadline: parseDate(task.deadline),
  };
}


function parseTimeSegment(timeSegment) {
  return new TimeSegment(
    timeSegment.id,
    timeSegment.name,
    parseDate(timeSegment.start),
    timeSegment.ranges.map(range => ({
      start: parseDate(range.start),
      end: parseDate(range.end),
    })),
    timeSegment.period,
  );
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

    async addTimeSegment(segment) {
      return wasmApi.add_time_segment(segment);
    },

    async deleteTimeSegment(segment) {
      return wasmApi.delete_time_segment(segment);
    },

    async updateTimeSegment(segment) {
      return wasmApi.update_time_segment(segment);
    },

    async listTimeSegments() {
      const timeSegments = await wasmApi.list_time_segments();
      return timeSegments.map(segment => parseTimeSegment(segment));
    },
  };
}


export default async function () {
  return API
    .then(jsApi)
    .catch(console.error);
}
