<template>
  <el-card>
    <h1>Time segments</h1>
    <div v-if="allSegmentsValid">
      <el-row>
        <radio
          v-for="segment in timeSegments"
          :key="segment.uniqueId"
          v-model="selectedSegment"
          :value="segment"
          :label="segment.uniqueId"
          :selected-label.sync="selectedSegmentLabel"
          group-name="segment"
          :color="segment.color.darken(0.3)"
          class="segment"
        >
          <el-input
            :ref="`input-${segment.uniqueId}`"
            v-model="segment.name"
            class="segment-name"
            @focus="$refs[`input-${segment.uniqueId}`][0].$parent.select()"
          />
        </radio>
        <el-button
          circle
          icon="el-icon-plus"
          class="add-segment-btn"
          @click="addTimeSegment"
        />
      </el-row>
      <el-row
        v-if="changed"
        type="flex"
        justify="center"
      >
        <el-button
          type="primary"
          icon="el-icon-check"
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
import * as DateTime from '@/datetime';

import Radio from '@/components/Radio';
import TimeSegmentPicker from '@/components/TimeSegmentPicker';


export default {
  name: 'TimeSegments',

  components: {
    Radio,
    TimeSegmentPicker,
  },

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
        .find(segment => segment.period !== DateTime.oneWeekInS);
    },

    allSegmentsValid() {
      return this.invalidSegment == null;
    },

    otherSegments() {
      // i.e. the ones that aren't selected
      return this.timeSegments.filter(segment => segment !== this.selectedSegment);
    },
  },

  watch: {
    timeSegments: {
      handler() {
        this.changed = true;
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
      } catch (error) {
        console.error(error);
        this.$message.error(error.toString());
      }
    },

    addTimeSegment() {
      const nextMonday = DateTime.firstDayOfWeek(0);
      const newSegment = new TimeSegment(undefined, '', nextMonday, [], DateTime.oneWeekInS);
      this.timeSegments.push(newSegment);
    },

    onSelectionChanged(selections) {
      this.selectedSegment.start = DateTime.firstDayOfWeek(0);
      this.selectedSegment.ranges = selections
        .flatMap(selection => selection.toSegmentRanges(this.selectedSegment));
    },

    async save() {
      try {
        const oldTimeSegments = await this.$api.listTimeSegments();
        const oldSegmentsMap = new Map(oldTimeSegments.map(segment => [segment.id, segment]));
        this.timeSegments.forEach((segment) => {
          if (oldSegmentsMap.get(segment.id) == null) {
            this.$api.addTimeSegment(segment);
          } else {
            this.$api.updateTimeSegment(segment);
            oldSegmentsMap.delete(segment.id);
          }
        });
        for (const segment of oldSegmentsMap.values()) {
          this.$api.deleteTimeSegment(segment);
        }
        this.changed = false;
        this.$message.success('Saved!');
      } catch (error) {
        console.error(error);
        this.$message.error(error.toString());
      }
    },
  },
};
</script>


<style lang="sass" scoped>
.segment
  height: inherit
  padding: 12px 20px 12px 10px

  .segment-name
    max-width: 200px

.add-segment-btn
  display: inline-block

.picker
  max-width: 600px
  margin: 20px auto 0 auto
</style>
