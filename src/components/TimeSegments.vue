<script setup>
import { Delete as DeleteIcon, Plus as PlusIcon, Check as CheckIcon } from '@element-plus/icons-vue';

import ColoredRadio from '@/components/ColoredRadio.vue';
import TimeSegmentPicker from '@/components/TimeSegmentPicker.vue';
</script>

<template>
  <el-card>
    <h1>Time segments</h1>
    <div v-if="allSegmentsValid">
      <el-row>
        <template
          v-for="segment in timeSegments"
          :key="segment.uniqueId"
        >
          <span class="segment">
            <ColoredRadio
              v-model="selectedSegment"
              v-model:selected-label="selectedSegmentLabel"
              :value="segment"
              :label="segment.uniqueId"
              group-name="segment"
              :color="segment.color.darken(0.3)"
              class="segment-radio"
            >
              <el-input
                :ref="`input-${segment.uniqueId}`"
                v-model="segment.name"
                class="segment-name"
                @focus="$refs[`input-${segment.uniqueId}`][0].$parent.select()"
              />
            </ColoredRadio>
            <el-button
              circle
              plain
              size="small"
              :icon="DeleteIcon"
              type="danger"
              @click="deleteTimeSegment(segment)"
            />
          </span>
          <!-- Since whitespace is otherwise stripped and the span above is
          unbreakable, this allows for a line breaking point -->
          {{ ' ' }}
        </template>
      </el-row>
      <el-row
        justify="center"
      >
        <el-button
          :icon="PlusIcon"
          class="add-segment-btn"
          @click="addTimeSegment"
        >
          Add
        </el-button>
        <el-button
          v-if="changed"
          type="primary"
          :icon="CheckIcon"
          @click="save"
        >
          Save
        </el-button>
      </el-row>
    </div>
    <el-alert
      v-else
      type="error"
      show-icon
    >
      Unfortunately, you can't edit your time segments since segment
      "{{ invalidSegment.name }}" isn't weekly. Could you
      <a href="https://github.com/Procrat/eva-web/issues/new">let my developer know</a>
      of this bug?
    </el-alert>

    <el-card class="picker">
      <TimeSegmentPicker
        :existing-segments="otherSegments"
        :selected-segment="selectedSegment"
        :disabled="!allSegmentsValid"
        @selection-changed="onSelectionChanged"
      />
    </el-card>
  </el-card>
</template>

<script>
import { TimeSegment } from '@/api';
import bus from '@/bus';
import * as DateTime from '@/datetime';

import ErrorHandling from '@/mixins/ErrorHandling';

export default {
  name: 'TimeSegments',

  mixins: [ErrorHandling],

  data() {
    return {
      timeSegments: [],
      selectedSegment: null,
      selectedSegmentLabel: null,
      changed: false,
    };
  },

  computed: {
    invalidSegment() {
      // Only accept weekly segments
      return this.timeSegments
        .find((segment) => segment.period !== DateTime.ONE_WEEK_IN_S);
    },

    allSegmentsValid() {
      return this.invalidSegment == null;
    },

    otherSegments() {
      // i.e. the ones that aren't selected
      return this.timeSegments.filter((segment) => segment !== this.selectedSegment);
    },
  },

  watch: {
    timeSegments: {
      handler(newSegments, oldSegments) {
        // Only set to changed when we don't have an entirely new list, which
        // would mean we just did a refetch from the database, in which case a
        // save button is unnecessary.
        this.changed = Object.is(newSegments, oldSegments);
      },
      deep: true,
    },
  },

  created() {
    this.refetch();
  },

  methods: {
    async refetch() {
      try {
        this.timeSegments = await this.$api.listTimeSegments();
        this.selectedSegment = null;
        this.selectedSegmentLabel = null;
        bus.$emit('time-segments-changed');
      } catch (error) {
        this.handleError(error);
      }
    },

    addTimeSegment() {
      const nextMonday = DateTime.firstDayOfWeek(0);
      const newSegment = new TimeSegment(
        undefined,
        '',
        nextMonday,
        [],
        DateTime.ONE_WEEK_IN_S,
        Math.floor(Math.random() * 360),
      );
      this.timeSegments.push(newSegment);
      this.$nextTick(() => {
        this.$refs[`input-${newSegment.uniqueId}`][0].focus();
      });
    },

    deleteTimeSegment(segment) {
      const index = this.timeSegments.findIndex((segment_) => segment_.id === segment.id);
      this.timeSegments.splice(index, 1);
    },

    onSelectionChanged(selections) {
      this.selectedSegment.start = DateTime.firstDayOfWeek(0);
      this.selectedSegment.ranges = selections
        .flatMap((selection) => selection.toSegmentRanges(this.selectedSegment));
    },

    async save() {
      try {
        const oldTimeSegments = await this.$api.listTimeSegments();
        const oldSegmentsMap = new Map(oldTimeSegments.map((segment) => [segment.id, segment]));
        const promises = [];
        this.timeSegments.forEach((segment) => {
          // Sorting of the segment ranges is delayed till here so not every new
          // selection would cause a resort.
          segment.ranges.sort((range1, range2) => range1.start - range2.start);
          if (oldSegmentsMap.get(segment.id) == null) {
            promises.push(this.$api.addTimeSegment(segment));
          } else {
            promises.push(this.$api.updateTimeSegment(segment));
            oldSegmentsMap.delete(segment.id);
          }
        });
        for (const segment of oldSegmentsMap.values()) {
          promises.push(this.$api.deleteTimeSegment(segment));
        }
        await Promise.all(promises);
        this.$message.success('Saved!');
      } catch (error) {
        this.handleError(error);
      }
      await this.refetch();
    },
  },
};
</script>

<style lang="sass" scoped>
.segment
  white-space: nowrap
  margin: 0px 15px

  .segment-radio
    height: inherit
    padding: 12px 20px 12px 10px
    margin-right: 0px

    .segment-name
      max-width: 200px

.add-segment-btn
  display: inline-block

.picker
  max-width: 600px
  margin: 20px auto 0 auto
</style>
