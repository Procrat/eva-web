<template>
  <ElCard>
    <div
      v-if="scheduleError"
      key="taskList"
    >
      <ElAlert
        :description="scheduleError"
        :closable="false"
        type="error"
        title=""
        show-icon
        class="alert"
      />

      <ElTable :data="tasks">
        <ElTableColumn>
          <template slot-scope="{ row }">
            {{ row.content }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          label="Deadline"
          align="center"
          width="140px"
        >
          <template slot-scope="{ row }">
            {{ row.deadline | formatDatetime }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          label="Duration"
          align="center"
          width="100px"
        >
          <template slot-scope="{ row }">
            {{ row.duration | formatDuration }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          label="Importance"
          align="center"
          width="120px"
        >
          <template slot-scope="{ row }">
            {{ row.importance }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          align="center"
          width="66px"
        >
          <template slot-scope="{ row }">
            <el-button
              :plain="true"
              size="mini"
              icon="delete"
              type="danger"
              @click="remove(row.id)"
            />
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <div
      v-else
      key="schedule"
      class="schedule"
    >
      <ElTable
        v-loading="loading"
        :data="schedule"
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

        <ElTableColumn
          label="Schedule"
          align="center"
          width="140px"
        >
          <template slot-scope="{ row }">
            {{ row.when | formatDatetime }}
          </template>
        </ElTableColumn>

        <ElTableColumn>
          <template slot-scope="{ row }">
            {{ row.task.content }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          label="Deadline"
          align="center"
          width="140px"
        >
          <template slot-scope="{ row }">
            {{ row.task.deadline | formatDatetime }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          label="Duration"
          align="center"
          width="100px"
        >
          <template slot-scope="{ row }">
            {{ row.task.duration | formatDuration }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          label="Importance"
          align="center"
          width="120px"
        >
          <template slot-scope="{ row }">
            {{ row.task.importance }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          align="center"
          width="66px"
        >
          <template slot-scope="{ row }">
            <ElButton
              :plain="true"
              type="danger"
              icon="delete"
              size="mini"
              @click="remove(row.task.id)"
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

  filters: {
    formatDatetime: DateTime.formatDatetime,
    formatDuration: DateTime.formatDuration,
  },

  props: {
    bus: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      schedule: [],
      loading: true,
      scheduleError: '',
      tasks: [],
    };
  },

  created() {
    this.bus
      .$on('task-added', this.reschedule)
      .$on('task-removed', this.reschedule);

    this.reschedule();
  },

  methods: {
    remove(id) {
      this.$api.removeTask(id)
        .then((_) => {
          this.$message.success('Task removed!');
          this.bus.$emit('task-removed');
        })
        .catch((error) => {
          this.$message.error(error);
        });
    },

    reschedule() {
      this.$api.schedule()
        .then((schedule) => {
          this.scheduleError = '';
          this.schedule = schedule;
          this.loading = false;
        })
        .catch((error) => {
          this.scheduleError = error.toString();
          this.$api.listTasks()
            .then((tasks) => { this.tasks = tasks; })
            .catch((error2) => { this.$message.error(error2); });
        });
    },
  },
};
</script>


<style lang="sass" scoped>
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
