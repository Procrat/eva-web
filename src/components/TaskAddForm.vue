<template>
  <ElCard>
    <ElForm class="add-task-form">
      <ElFormItem>
        <ElInput v-model="content"
          placeholder="What do you want to do?"
          />
      </ElFormItem>

      <ElFormItem>
        <ElRow type="flex" :gutter="5" class="deadline">
          <ElCol>
            <ElDatePicker v-model="deadlineDate"
              placeholder="Deadline"
              format="dd/MM"
              :picker-options="timePickerOptions"
              class="deadline-date" />
          </ElCol>
          <ElCol>
            <ElTimeSelect v-model="deadlineTime"
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
        <ElSelect v-model="durationMinutes"
          filterable
          default-first-option
          placeholder="Duration"
          class="duration"
          >
          <ElOption v-for="option in durationOptions"
            :key="option.minutes"
            :label="option.stringified"
            :value="option.minutes"
            />
        </ElSelect>
      </ElFormItem>

      <ElFormItem>
        <ElSlider v-model="importance"
          :min="0"
          :max="10"
          :format-tooltip="formatImportance"
          />
      </ElFormItem>

      <ElRow type="flex" justify="center">
        <ElButton @click="addTask" type="primary">
          Let's do this!
        </ElButton>
      </ElRow>
    </ElForm>
  </ElCard>
</template>


<script>
import * as DateTime from '@/datetime';

export default {
  name: 'TaskAddForm',

  props: ['bus'],

  constants: {
    durationOptions: [
      {minutes: 2, stringified: '2 minutes'},
      {minutes: 5, stringified: '5 minutes'},
      {minutes: 10, stringified: '10 minutes'},
      {minutes: 15, stringified: '15 minutes'},
      {minutes: 30, stringified: '30 minutes'},
      {minutes: 60, stringified: '1 hour'},
      {minutes: 120, stringified: '2 hours'},
    ],

    timePickerOptions: {
      firstDayOfWeek: 1,
      disabledDate(date) {
        return date < DateTime.today();
      },
      shortcuts: [
        {
          text: 'Today',
          onClick(picker) {
            picker.$emit('pick', DateTime.today());
          }
        }, {
          text: 'Tomorrow',
          onClick(picker) {
            picker.$emit('pick', DateTime.tomorrow());
          }
        }, {
          text: 'This week',
          onClick(picker) {
            picker.$emit('pick', DateTime.nextDayOfWeek(6));
          }
        }, {
          text: '+1 week',
          onClick(picker) {
            picker.$emit('pick', DateTime.inNDays(7));
          }
        }, {
          text: '+2 weeks',
          onClick(picker) {
            picker.$emit('pick', DateTime.inNDays(14));
          }
        }, {
          text: 'This month',
          onClick(picker) {
            picker.$emit('pick', DateTime.lastDayOfMonth());
          }
        }, {
          text: '+1 month',
          onClick(picker) {
            picker.$emit('pick', DateTime.inNMonths(1));
          }
        }
      ]
    },
  },

  data() {
    return {
      content: '',
      deadlineDate: '',
      deadlineTime: '',
      durationMinutes: '',
      importance: 5,
    }
  },

  methods: {
    addTask(event) {
      // TODO replace this poor man's validation
      assert(this.content, 'No task given');
      assert(this.deadlineDate || this.deadlineTime, 'No deadline given');
      assert(this.durationMinutes, 'No duration given');

      let deadline = this.deadlineDate || DateTime.today();
      let deadlineTime = (this.deadlineTime || '23:59')
        .split(':')
        .map((value) => parseInt(value));
      deadline.setHours(deadlineTime[0], deadlineTime[1]);
      assert(deadline > new Date(), 'Deadline is in the past');

      let task = {
        content: this.content,
        deadline: deadline,
        duration_minutes: this.durationMinutes,
        importance: parseInt(this.importance),
      };

      let result = this.$api.addTask(task);

      if (result != null) {
        this.$message.error(result.error);
      } else {
        this.$message.success('Task added!');

        this.content = '';
        this.deadlineDate = '';
        this.deadlineTime = '';
        this.durationMinutes = '';
        this.importance = 5;

        this.bus.$emit('task-added');
      }
    },

    formatImportance(importance) {
      return 'Importance: ' + importance;
    },
  },
}
</script>


<style scoped lang="sass">
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
