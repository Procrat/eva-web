<template>
  <el-card>
    <el-form
      ref="form"
      :model="this"
      :rules="formRules"
      class="add-task-form"
      :show-message="false"
      @submit.native.prevent="addTask"
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
          format="MMM d  H:mm"
          :picker-options="deadlinePickerOptions"
          default-time="23:59:00"
          prefix-icon="el-icon-date"
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
        type="flex"
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
import * as DateTime from '@/datetime';

export default {
  name: 'TaskAddForm',

  props: {
    bus: {
      type: Object,
      required: true,
    },
  },

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

    deadlinePickerOptions: {
      firstDayOfWeek: 1,
      disabledDate(date) {
        return date <= new Date();
      },
      shortcuts: [{
        text: 'Today',
        onClick(picker) {
          picker.$emit('pick', DateTime.endOfDay(DateTime.today()));
        },
      }, {
        text: 'Tomorrow',
        onClick(picker) {
          picker.$emit('pick', DateTime.endOfDay(DateTime.tomorrow()));
        },
      }, {
        text: 'This week',
        onClick(picker) {
          picker.$emit('pick', DateTime.endOfDay(DateTime.firstDayOfWeek(6)));
        },
      }, {
        text: '+1 week',
        onClick(picker) {
          picker.$emit('pick', DateTime.endOfDay(DateTime.inNWeeks(1)));
        },
      }, {
        text: '+2 weeks',
        onClick(picker) {
          picker.$emit('pick', DateTime.endOfDay(DateTime.inNWeeks(2)));
        },
      }, {
        text: 'This month',
        onClick(picker) {
          picker.$emit('pick', DateTime.endOfDay(DateTime.lastDayOfMonth()));
        },
      }, {
        text: '+1 month',
        onClick(picker) {
          picker.$emit('pick', DateTime.endOfDay(DateTime.inNMonths(1)));
        },
      }],
    },
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
          validator: (_rule, value, callback) => {
            if (this.timeSegments.find(segment => segment.id === this.timeSegmentId) == null) {
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
    this.bus.$on('time-segments-changed', () => {
      this.fetchTimeSegments();
    });
    this.fetchTimeSegments();
  },

  methods: {
    async addTask() {
      let valid;

      this.$refs.form.validate((valid_, erroneousFields) => {
        valid = valid_;
        if (!valid) {
          const firstError = Object.entries(erroneousFields)[0][1][0];
          this.$message.error(firstError.message);
        }
      });

      if (!valid) {
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
        this.$refs.form.resetFields();
        this.bus.$emit('task-added');
      } catch (error) {
        this.$message.error(error);
      }
    },

    async fetchTimeSegments() {
      try {
        this.timeSegments = await this.$api.listTimeSegments();
        await this.setFallbackTimeSegment();
      } catch (error) {
        console.error(error);
        this.$message.error(error.toString());
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
