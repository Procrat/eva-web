import Color from 'color';

const API = import('@backend/eva.js');

export class TimeSegment {
  constructor(id, name, start, ranges, period, hue) {
    this.id = id;
    this.name = name;
    this.start = start;
    this.ranges = ranges;
    this.period = period;
    this.color = new Color({ h: hue, s: 100, l: 80 });
    this.uniqueId = `${this.name}:${this.id || new Date().getTime()}`;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      start: this.start,
      ranges: this.ranges,
      period: this.period,
      hue: this.color.hue(),
    };
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
    timeSegment.ranges.map((range) => ({
      start: parseDate(range.start),
      end: parseDate(range.end),
    })),
    timeSegment.period,
    timeSegment.hue,
  );
}

async function jsApi(wasmApi) {
  await wasmApi.initialize();

  return {
    async addTask(task) {
      const addedTask = await wasmApi.add_task(task);
      return parseTask(addedTask);
    },

    async removeTask(id) {
      return wasmApi.remove_task(id);
    },

    async updateTask(task) {
      return wasmApi.update_task(task);
    },

    async listTasks() {
      const tasks = await wasmApi.list_tasks();
      return tasks.map(parseTask);
    },

    async schedule() {
      const scheduledTasks = await wasmApi.schedule();
      return scheduledTasks.map((scheduledTask) => ({
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
      return timeSegments.map(parseTimeSegment);
    },
  };
}

export default async function api() {
  try {
    return jsApi(await API);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
