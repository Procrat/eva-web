<script setup>
import { Calendar as CalendarIcon } from '@element-plus/icons-vue';
</script>

<template>
  <el-card>
    <el-form
      ref="form"
      :model="this"
      :rules="formRules"
      class="add-task-form"
      :show-message="false"
      @submit.prevent="addTask"
    >
      <el-form-item prop="content">
        <el-input
          v-model="content"
          placeholder="What do you want to do?"
        />
      </el-form-item>

      <el-form-item prop="deadline">
        <el-date-picker
          v-model="deadline"
          type="datetime"
          :clearable="false"
          placeholder="Deadline"
          format="ddd D MMM  H:mm"
          :default-time="new Date(2000, 1, 1, 23, 59, 0)"
          :disabled-date="(date) => date <= new Date()"
          :shortcuts="deadlinePickerShortcuts"
          :prefix-icon="CalendarIcon"
          class="deadline"
        />
      </el-form-item>

      <el-form-item prop="durationMinutes">
        <el-select
          v-model="durationMinutes"
          filterable
          default-first-option
          placeholder="Duration"
          class="duration"
        >
          <el-option
            v-for="option in durationOptions"
            :key="option.minutes"
            :label="option.stringified"
            :value="option.minutes"
          />
        </el-select>
      </el-form-item>

      <el-form-item prop="importance">
        <el-slider
          v-model="importance"
          :min="0"
          :max="10"
          :format-tooltip="formatImportance"
        />
      </el-form-item>

      <el-form-item
        ref="timeSegment"
        prop="timeSegmentId"
        :class="{ hidden: timeSegments.length <= 1 }"
      >
        <el-select
          v-model="timeSegmentId"
          filterable
          default-first-option
          placeholder="Time Segment"
          class="time-segment"
        >
          <el-option
            v-for="timeSegment in timeSegments"
            :key="timeSegment.uniqueId"
            :label="formatTimeSegment(timeSegment)"
            :value="timeSegment.id"
          />
        </el-select>
      </el-form-item>

      <el-row
        justify="center"
      >
        <el-button
          type="primary"
          native-type="submit"
        >
          Let's do this!
        </el-button>
      </el-row>
    </el-form>
  </el-card>
</template>

<script>
import bus from '@/bus';
import * as DateTime from '@/datetime';

import ErrorHandling from '@/mixins/ErrorHandling';

export default {
  name: 'TaskAddForm',

  mixins: [ErrorHandling],

  constants: {
    durationOptions: [
      { minutes: 2, stringified: '2 minutes' },
      { minutes: 5, stringified: '5 minutes' },
      { minutes: 10, stringified: '10 minutes' },
      { minutes: 15, stringified: '15 minutes' },
      { minutes: 30, stringified: '30 minutes' },
      { minutes: 60, stringified: '1 hour' },
      { minutes: 120, stringified: '2 hours' },
    ],

    deadlinePickerShortcuts: [{
      text: 'Today',
      value: () => DateTime.endOfDay(DateTime.today()),
    }, {
      text: 'Tomorrow',
      value: () => DateTime.endOfDay(DateTime.tomorrow()),
    }, {
      text: 'This week',
      value: () => DateTime.endOfDay(DateTime.firstDayOfWeek(6)),
    }, {
      text: '+1 week',
      value: () => DateTime.endOfDay(DateTime.inNWeeks(1)),
    }, {
      text: '+2 weeks',
      value: () => DateTime.endOfDay(DateTime.inNWeeks(2)),
    }, {
      text: 'This month',
      value: () => DateTime.endOfDay(DateTime.lastDayOfMonth()),
    }, {
      text: '+1 month',
      value: () => DateTime.endOfDay(DateTime.inNMonths(1)),
    }],
  },

  data() {
    return {
      content: null,
      deadline: null,
      durationMinutes: null,
      importance: 5,
      timeSegmentId: null,
      timeSegments: [],

      formRules: {
        content: [{
          required: true,
          trigger: 'change',
          message: 'You didn\'t say what it is you want to achieve.',
        }],
        deadline: [{
          required: true,
          trigger: 'change',
          message: 'You didn\'t mention when it\'s due.',
        }, {
          validator: (_rule, value, callback) => {
            if (value <= new Date()) {
              callback(new Error('The deadline you specified is in the past.'));
            } else {
              callback();
            }
          },
          trigger: 'change',
        }],
        durationMinutes: [{
          required: true,
          trigger: 'change',
          message: 'You didn\'t mention how long you think it would take.',
        }],
        importance: [{ required: true, trigger: 'change' }],
        timeSegmentId: [{
          required: true,
          message: 'You didn\'t select a time segment.',
        }, {
          validator: (_rule, _value, callback) => {
            if (this.timeSegments.find((segment) => segment.id === this.timeSegmentId) == null) {
              callback(new Error('The segment you selected doesn\'t exist.'));
            } else {
              callback();
            }
          },
        }],
      },
    };
  },

  created() {
    bus.$on('time-segments-changed', () => {
      this.fetchTimeSegments();
    });
    this.fetchTimeSegments();
  },

  methods: {
    async addTask() {
      try {
        await this.$refs.form.validate();
      } catch (errors) {
        const firstError = Object.values(errors)[0][0];
        this.$message.error(firstError.message);
        return;
      }

      const task = {
        content: this.content,
        deadline: this.deadline,
        duration: this.durationMinutes * 60,
        importance: this.importance,
        time_segment_id: this.timeSegmentId,
      };

      try {
        await this.$api.addTask(task);
        this.$message.success('Task added!');
        this.resetFields();
        bus.$emit('task-added');
      } catch (error) {
        this.handleError(error);
      }
    },

    async fetchTimeSegments() {
      try {
        this.timeSegments = await this.$api.listTimeSegments();
        await this.setFallbackTimeSegment();
      } catch (error) {
        this.handleError(error);
      }
    },

    async setFallbackTimeSegment() {
      if (!(await this.isTimeSegmentIdValid())
          && this.timeSegments.length > 0) {
        this.timeSegmentId = this.timeSegments[0].id;
      }
    },

    async isTimeSegmentIdValid() {
      return this.timeSegmentId != null
        && new Promise((resolve, _reject) => {
          this.$refs.timeSegment.validate('', (_message, erroneousFields) => {
            resolve(erroneousFields != null);
          });
        });
    },

    formatImportance(importance) {
      return `Importance: ${importance}`;
    },

    formatTimeSegment(timeSegment) {
      if (timeSegment.name === 'Default') {
        return 'Default time segment';
      }
      if (!timeSegment.name) {
        return '(unnamed)';
      }
      return timeSegment.name;
    },

    resetFields() {
      const oldTimeSegmentId = this.timeSegmentId;
      this.$refs.form.resetFields();
      this.timeSegmentId = oldTimeSegmentId;
    },
  },
};
</script>

<style lang="sass" scoped>
.add-task-form
  .duration, .deadline, .time-segment
    width: 100% !important

.hidden
  display: none
</style>
