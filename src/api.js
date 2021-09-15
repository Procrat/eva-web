import Color from 'color';

import * as backend from '@backend/eva.js';

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

async function jsBackend() {
  await backend.initialize();

  return {
    async addTask(task) {
      const addedTask = await backend.add_task(task);
      return parseTask(addedTask);
    },

    async removeTask(id) {
      return backend.remove_task(id);
    },

    async updateTask(task) {
      return backend.update_task(task);
    },

    async listTasks() {
      const tasks = await backend.list_tasks();
      return tasks.map(parseTask);
    },

    async schedule() {
      const scheduledTasks = await backend.schedule();
      return scheduledTasks.map((scheduledTask) => ({
        when: parseDate(scheduledTask.when),
        task: parseTask(scheduledTask.task),
      }));
    },

    async addTimeSegment(segment) {
      return backend.add_time_segment(segment);
    },

    async deleteTimeSegment(segment) {
      return backend.delete_time_segment(segment);
    },

    async updateTimeSegment(segment) {
      return backend.update_time_segment(segment);
    },

    async listTimeSegments() {
      const timeSegments = await backend.list_time_segments();
      return timeSegments.map(parseTimeSegment);
    },
  };
}

export default async function api() {
  try {
    return jsBackend();
  } catch (error) {
    console.error(error);
    throw error;
  }
}
