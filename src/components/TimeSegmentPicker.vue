<template>
  <table :class="{ 'selectable': selectable }">
    <caption v-if="selectable">
      Hold Ctrl to make multiple selections.
    </caption>
    <thead>
      <tr>
        <th />
        <th
          v-for="day in days"
          :key="day.valueOf()"
        >
          {{ day.name }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="time in times"
        :key="time.valueOf()"
      >
        <th><span>{{ time.toString() }}</span></th>
        <cell
          v-for="day in days"
          :key="day.valueOf()"
          :day="day"
          :time="time"
          :name="cells[day.index][time.hour].name"
          :color="cells[day.index][time.hour].color"
          :selected="cells[day.index][time.hour].selected"
          @mousedown="onMouseDown"
          @mouseover="onMouseOver"
          @mouseup="onMouseUp"
        />
      </tr>
    </tbody>
  </table>
</template>

<script>
import * as DateTime from '@/datetime';
import { TimeSegment } from '@/api';
import Cell from '@/components/TimeSegmentPickerCell.vue';

export class Selection {
  constructor(name, color, first, second) {
    this.name = name;
    this.color = color;
    this.first = first;
    this.second = second;
    this.updateStartAndEnd();
  }

  withSecond(second) {
    return new Selection(this.name, this.color, this.first, second);
  }

  updateStartAndEnd() {
    const sortedDays = [this.first, this.second]
      .map((cell) => cell.day)
      .sort((day1, day2) => day1.valueOf() - day2.valueOf());
    const sortedTimes = [this.first, this.second]
      .map((cell) => cell.time)
      .sort((time1, time2) => time1.valueOf() - time2.valueOf());
    this.start = { day: sortedDays[0], time: sortedTimes[0] };
    this.end = { day: sortedDays[1], time: sortedTimes[1] };
  }

  contains(day, time) {
    return this.start.day.le(day) && day.le(this.end.day)
      && this.start.time.le(time) && time.le(this.end.time);
  }

  overlapsWith(other) {
    return !(this.start.day.gt(other.end.day)
             || this.end.day.lt(other.start.day)
             || this.start.time.gt(other.end.time)
             || this.end.time.lt(other.start.time));
  }

  toSegmentRanges(segment) {
    console.assert(segment.period === DateTime.ONE_WEEK_IN_S);

    function toDate(day, time) {
      return DateTime.firstDayAndHourAfter(segment.start, day.index, time.hour);
    }

    // If the range loops overnight, we can put all days in one range
    if (this.start.time.hour === 0 && this.end.time.hour === 23) {
      return [{
        start: toDate(this.start.day, this.start.time),
        end: toDate(this.end.day, this.end.time.nextHour()),
      }];
    }

    // Otherwise, we put each day in its own range
    const ranges = [];
    let { day } = this.start;
    while (day.ne(this.end.day)) {
      ranges.push({
        start: toDate(day, this.start.time),
        end: toDate(day, this.end.time.nextHour()),
      });
      day = day.nextDay();
    }
    ranges.push({
      start: toDate(this.end.day, this.start.time),
      end: toDate(this.end.day, this.end.time.nextHour()),
    });
    return ranges;
  }

  static fromSegment(segment) {
    console.assert(segment.period === DateTime.ONE_WEEK_IN_S);
    return segment.ranges.flatMap(({ start, end }) => {
      const selections = [];

      let startDay = new DateTime.Day((start.getDay() + 6) % 7); // Sunday-indexed -> Monday-indexed
      const endDay = new DateTime.Day((end.getDay() + 6) % 7); // Sunday-indexed -> Monday-indexed
      let startTime = new DateTime.Time(start.getHours());
      let endTime = new DateTime.Time(end.getHours());
      if (end.getMinutes() === 0) {
        endTime = endTime.previousHour();
      }
      if (end - start === DateTime.ONE_WEEK_IN_MS) {
        endTime = endTime.previousHour();
      }

      while (!startDay.eq(endDay) || endTime.lt(startTime)) {
        selections.push(new Selection(
          segment.name,
          segment.color,
          { day: startDay, time: startTime },
          { day: startDay, time: new DateTime.Time(23) },
        ));

        startDay = startDay.nextDay();
        startTime = new DateTime.Time(0);
      }
      selections.push(new Selection(
        segment.name,
        segment.color,
        { day: startDay, time: startTime },
        { day: endDay, time: endTime },
      ));

      return selections;
    });
    // TODO compress the resulting selections
  }
}

export default {
  name: 'TimeSegmentPicker',

  components: {
    Cell,
  },

  constants: {
    days: DateTime.DAYS_OF_THE_WEEK.map((_, index) => new DateTime.Day(index)),
    times: Array.from({ length: 24 }, (_, i) => new DateTime.Time(i)),
  },

  props: {
    existingSegments: { type: Array, required: true },
    selectedSegment: { type: TimeSegment, default: null },
    disabled: { type: Boolean, default: false },
  },

  data() {
    return {
      selection: null,
      otherSelections: this.selectedSegment != null
        ? Selection.fromSegment(this.selectedSegment)
        : [],
      selecting: false,
    };
  },

  computed: {
    selectable() {
      return !this.disabled && this.selectedSegment != null;
    },

    simplifiedExistingSegments() {
      return this.existingSegments.flatMap(Selection.fromSegment);
    },

    // This is a terrible name; it means everything except the current
    // selection.
    otherSegments() {
      return this.simplifiedExistingSegments.concat(this.otherSelections);
    },

    allSelections() {
      return this.selection == null
        ? this.otherSelections
        : this.otherSelections.concat([this.selection]);
    },

    cells() {
      const cells = Array(7).fill(null).map((_) => Array(24).fill({}));
      const fillCells = (selected, segment) => {
        for (let dayIdx = segment.start.day.index; dayIdx <= segment.end.day.index; dayIdx += 1) {
          for (let { hour } = segment.start.time; hour <= segment.end.time.hour; hour += 1) {
            cells[dayIdx][hour] = {
              name: segment.name,
              color: segment.color,
              selected,
            };
          }
        }
      };
      this.allSelections.forEach(fillCells.bind(null, true));
      this.simplifiedExistingSegments.forEach(fillCells.bind(null, false));
      return cells;
    },
  },

  watch: {
    selectedSegment: {
      handler() {
        this.otherSelections = this.selectedSegment != null
          ? Selection.fromSegment(this.selectedSegment)
          : [];
        this.selection = null;
      },
      deep: true,
    },
  },

  methods: {
    onMouseDown(cell, event) {
      if (!this.selectable || this.selecting) {
        return;
      }
      if (event.ctrlKey) {
        if (this.selection != null) {
          this.otherSelections.push(this.selection);
        }
      } else {
        this.otherSelections = [];
      }
      if (!this.otherSegments.some((segment) => segment.contains(cell.day, cell.time))) {
        this.selecting = true;
        this.selection = new Selection(
          this.selectedSegment.name,
          this.selectedSegment.color,
          cell,
          cell,
        );
      }
    },

    onMouseOver(cell) {
      if (!this.selectable || !this.selecting) {
        return;
      }
      const newSelection = this.selection.withSecond(cell);
      const overlapping = this.otherSegments.some(
        (segment) => newSelection.overlapsWith(segment),
      );
      if (!overlapping) {
        this.selection = newSelection;
      }
    },

    onMouseUp(_cell) {
      if (!this.selectable || !this.selecting) {
        return;
      }
      this.selecting = false;
      this.$emit('selection-changed', this.allSelections);
    },
  },
};
</script>

<style lang="sass" scoped>
table
  width: 100%
  max-width: 100%
  table-layout: fixed
  user-select: none
  touch-action: none

caption
  font-size: 12px
  color: #909399

th
  padding: 12px
  color: #909399
  font-weight: 500
  table.selectable &
    color: #606266

thead th
  text-align: center
  vertical-align: middle

tbody th
  text-align: right
  padding: 0 12px 24px 12px
  vertical-align: top
  span
    position: relative
    top: -0.5em

td
  border: 1px solid #ebeef5
</style>
