<template>
  <ElCard>
    <div v-if="scheduleError" key="taskList">
      <ElAlert
        type="error"
        title=""
        :description="scheduleError"
        show-icon
        :closable="false"
        class="alert"
        />

      <ElTable :data="tasks">
        <ElTableColumn>
          <template scope="scope">
            {{ scope.row.content }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="Deadline"
          align="center"
          width="140px"
          >
          <template scope="scope">
            {{ scope.row.deadline | formatDatetime }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="Duration"
          align="center"
          width="100px"
          >
          <template scope="scope">
            {{ scope.row.duration_minutes | formatDuration }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="Importance"
          align="center"
          width="120px"
          >
          <template scope="scope">
            {{ scope.row.importance }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          align="center"
          width="66px"
          >
          <template scope="scope">
            <el-button @click="remove(scope.row.id)"
              type="danger"
              :plain="true"
              icon="delete"
              size="mini"
              />
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <div v-else key="schedule" class="schedule">
      <ElTable :data="schedule"
        v-loading="loading"
        element-loading-text="Thinking really hard about your schedule..."
        >

        <div slot="empty">
          Add your first task and world domination will soon be yours!¹
          <br><br>
          <span style="font-size: 10px">
            ¹ There is no proven correlation between using Eva and
            achieving world domination.
          </span>
        </div>

        <ElTableColumn label="Schedule"
          align="center"
          width="140px"
          >
          <template scope="scope">
            {{ scope.row.when | formatDatetime }}
          </template>
        </ElTableColumn>

        <ElTableColumn>
          <template scope="scope">
            {{ scope.row.task.content }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="Deadline"
          align="center"
          width="140px"
          >
          <template scope="scope">
            {{ scope.row.task.deadline | formatDatetime }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="Duration"
          align="center"
          width="100px"
          >
          <template scope="scope">
            {{ scope.row.task.duration_minutes | formatDuration }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="Importance"
          align="center"
          width="120px"
          >
          <template scope="scope">
            {{ scope.row.task.importance }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          align="center"
          width="66px"
          >
          <template scope="scope">
            <ElButton @click="remove(scope.row.task.id)"
              type="danger"
              :plain="true"
              icon="delete"
              size="mini"
              />
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </ElCard>
</template>


<script>
import * as DateTime from '@/datetime';

export default {
  name: 'Schedule',

  props: ['bus'],

  filters: {
    formatDatetime: DateTime.formatDatetime,
    formatDuration: DateTime.formatDuration,
  },

  data() {
    return {
      schedule: [],
      loading: true,
      scheduleError: '',
      tasks: [],
    }
  },

  created() {
    this.bus
      .$on('task-added', this.reschedule)
      .$on('task-removed', this.reschedule);

    this.reschedule();
  },

  methods: {
    remove(id) {
      let result = this.$api.removeTask(id);

      if (result != null) {
        this.$message.error(result.error);
      } else {
        this.$message.success("Task removed!");
      }

      this.bus.$emit('task-removed');
    },

    reschedule(event) {
      let result = this.$api.schedule();
      console.assert(result != null, "Reschedule returned null");

      if (result.error == null) {
        this.scheduleError = '';
        this.schedule = result;
        this.loading = false;
      } else {
        this.scheduleError = result.error;
        this.tasks = this.$api.listTasks();
      }
    },
  },
}
</script>


<style scoped lang="sass">
.alert.el-alert
  margin-bottom: 20px
  .el-alert__content
    padding-left: 16px
  .el-alert__description
    margin: 5px 0

.schedule
  .el-table
    .cell
      padding: 6px 18px
    .el-table__empty-block
      min-height: 225px
</style>
