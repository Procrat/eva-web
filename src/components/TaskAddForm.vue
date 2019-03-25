<template>
  <ElCard>
    <ElForm class="add-task-form">
      <ElFormItem>
        <ElInput
          v-model="content"
          placeholder="What do you want to do?"
        />
      </ElFormItem>

      <ElFormItem>
        <ElRow
          :gutter="5"
          type="flex"
          class="deadline"
        >
          <ElCol>
            <ElDatePicker
              v-model="deadlineDate"
              :picker-options="timePickerOptions"
              placeholder="Deadline"
              format="dd/MM"
              class="deadline-date"
            />
          </ElCol>
          <ElCol>
            <ElTimeSelect
              v-model="deadlineTime"
              :picker-options="{
                start: '00:00',
                step: '00:30',
                end: '23:59'
              }"
              class="deadline-time"
            />
          </ElCol>
        </ElRow>
      </ElFormItem>

      <ElFormItem>
        <ElSelect
          v-model="durationMinutes"
          filterable
          default-first-option
          placeholder="Duration"
          class="duration"
        >
          <ElOption
            v-for="option in durationOptions"
            :key="option.minutes"
            :label="option.stringified"
            :value="option.minutes"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem>
        <ElSlider
          v-model="importance"
          :min="0"
          :max="10"
          :format-tooltip="formatImportance"
        />
      </ElFormItem>

      <ElRow
        type="flex"
        justify="center"
      >
        <ElButton
          type="primary"
          @click="addTask"
        >
          Let's do this!
        </ElButton>
      </ElRow>
    </ElForm>
  </ElCard>
</template>


<script>
import Vue from 'vue';
import * as DateTime from '@/datetime';


export default Vue.extend({
  name: 'TaskAddForm',

  props: {
    bus: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      content: '',
      deadlineDate: '',
      deadlineTime: '',
      durationMinutes: '',
      importance: 5,
    };
  },

  created() {
    this.durationOptions = [
      { minutes: 2, stringified: '2 minutes' },
      { minutes: 5, stringified: '5 minutes' },
      { minutes: 10, stringified: '10 minutes' },
      { minutes: 15, stringified: '15 minutes' },
      { minutes: 30, stringified: '30 minutes' },
      { minutes: 60, stringified: '1 hour' },
      { minutes: 120, stringified: '2 hours' },
    ];

    this.timePickerOptions = {
      firstDayOfWeek: 1,
      disabledDate(date) {
        return date < DateTime.today();
      },
      shortcuts: [
        {
          text: 'Today',
          onClick(picker) {
            picker.$emit('pick', DateTime.today());
          },
        }, {
          text: 'Tomorrow',
          onClick(picker) {
            picker.$emit('pick', DateTime.tomorrow());
          },
        }, {
          text: 'This week',
          onClick(picker) {
            picker.$emit('pick', DateTime.nextDayOfWeek(6));
          },
        }, {
          text: '+1 week',
          onClick(picker) {
            picker.$emit('pick', DateTime.inNDays(7));
          },
        }, {
          text: '+2 weeks',
          onClick(picker) {
            picker.$emit('pick', DateTime.inNDays(14));
          },
        }, {
          text: 'This month',
          onClick(picker) {
            picker.$emit('pick', DateTime.lastDayOfMonth());
          },
        }, {
          text: '+1 month',
          onClick(picker) {
            picker.$emit('pick', DateTime.inNMonths(1));
          },
        },
      ],
    };
  },

  methods: {
    addTask() {
      if (!this.content) {
        this.$message.error('You didn\'t say what it is you want to achieve.');
        return;
      }
      if (!this.deadlineDate && !this.deadlineTime) {
        this.$message.error('You didn\'t mention when it\'s due.');
        return;
      }
      if (!this.durationMinutes) {
        this.$message.error('You didn\'t mention how long you think it would take.');
        return;
      }

      const deadline = this.deadlineDate || DateTime.today();
      const deadlineTime = (this.deadlineTime || '23:59')
        .split(':')
        .map(value => parseInt(value, 10));
      deadline.setHours(deadlineTime[0], deadlineTime[1]);
      if (!(deadline > new Date())) {
        this.$message.error('The deadline you specified is in the past.');
        return;
      }

      const task = {
        content: this.content,
        deadline,
        duration: this.durationMinutes * 60,
        importance: parseInt(this.importance, 10),
        time_segment_id: 0,
      };

      this.$api.addTask(task)
        .then((_addedTask) => {
          this.$message.success('Task added!');

          this.content = '';
          this.deadlineDate = '';
          this.deadlineTime = '';
          this.durationMinutes = '';
          this.importance = 5;

          this.bus.$emit('task-added');
        })
        .catch(error => this.$message.error(error));
    },

    formatImportance(importance) {
      return `Importance: ${importance}`;
    },
  },
});
</script>


<style lang="sass" scoped>
.add-task-form
  .duration, .deadline-date, .deadline-time
    width: 100% !important

  .deadline
    flex-wrap: wrap
  .deadline > *
    flex: 0 0 50%
    @media (max-width: 1100px)
      flex: 0 0 100%
</style>
