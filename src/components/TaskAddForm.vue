<template>
  <el-card>
    <el-form class="add-task-form">
      <el-form-item>
        <el-input
          v-model="content"
          placeholder="What do you want to do?"
        />
      </el-form-item>

      <el-form-item>
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

      <el-form-item>
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

      <el-form-item>
        <el-slider
          v-model="importance"
          :min="0"
          :max="10"
          :format-tooltip="formatImportance"
        />
      </el-form-item>

      <el-row
        type="flex"
        justify="center"
      >
        <el-button
          type="primary"
          @click="addTask"
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
      shortcuts: [
        {
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
            picker.$emit('pick', DateTime.endOfDay(DateTime.nextDayOfWeek(6)));
          },
        }, {
          text: '+1 week',
          onClick(picker) {
            picker.$emit('pick', DateTime.endOfDay(DateTime.inNDays(7)));
          },
        }, {
          text: '+2 weeks',
          onClick(picker) {
            picker.$emit('pick', DateTime.endOfDay(DateTime.inNDays(14)));
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
        },
      ],
    },
  },

  data() {
    return {
      content: null,
      deadline: null,
      durationMinutes: null,
      importance: 5,
    };
  },

  methods: {
    addTask() {
      if (!this.content) {
        this.$message.error('You didn\'t say what it is you want to achieve.');
        return;
      }
      if (!this.deadline) {
        this.$message.error('You didn\'t mention when it\'s due.');
        return;
      }
      if (!this.durationMinutes) {
        this.$message.error('You didn\'t mention how long you think it would take.');
        return;
      }

      if (!(this.deadline > new Date())) {
        this.$message.error('The deadline you specified is in the past.');
        return;
      }

      const task = {
        content: this.content,
        deadline: this.deadline,
        duration: this.durationMinutes * 60,
        importance: this.importance,
        time_segment_id: 0,
      };

      this.$api.addTask(task)
        .then((_addedTask) => {
          this.$message.success('Task added!');

          this.content = null;
          this.deadline = null;
          this.durationMinutes = null;
          this.importance = 5;

          this.bus.$emit('task-added');
        })
        .catch(error => this.$message.error(error));
    },

    formatImportance(importance) {
      return `Importance: ${importance}`;
    },
  },
};
</script>


<style lang="sass" scoped>
.add-task-form
  .duration, .deadline
    width: 100% !important
</style>
