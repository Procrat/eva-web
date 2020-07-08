import { expect } from 'chai';

import * as DT from '@/datetime';


const aMinuteInMs = 60 * 1000;
const anHourInMs = 60 * aMinuteInMs;
const aDayInMs = 24 * anHourInMs;
const aWeekInMs = 7 * aDayInMs;
const today = DT.today();


/** Returns a point in time between 1.5 weeks ago and 1.5 weeks from now */
function sampleDatetime() {
  const offset = (Math.random() * 3 - 1.5) * DT.ONE_WEEK_IN_MS;
  return new Date((new Date()).getTime() + offset);
}

/** Returns the difference in DST offset of the given Date objects, in ms */
function dstDiff(datetime1, datetime2) {
  return (datetime1.getTimezoneOffset() - datetime2.getTimezoneOffset()) * 60 * 1000;
}


describe('datetime', () => {
  describe('#addHours', () => {
    it('should add hours', () => {
      const t0 = sampleDatetime();
      const t1 = DT.addHours(t0, 42);
      expect(t1 - t0).to.equal(42 * anHourInMs + dstDiff(t1, t0));
    });
  });

  describe('#today', () => {
    it('should return the start of today', () => {
      const t = DT.today();
      expect(t.toDateString()).to.equal(new Date().toDateString());
      expect(t.toTimeString().substring(0, 8)).to.equal('00:00:00');
    });
  });

  describe('#addDays', () => {
    it('should add days', () => {
      const t0 = sampleDatetime();
      const t1 = DT.addDays(t0, 42);
      expect(t1 - t0).to.equal(42 * aDayInMs + dstDiff(t1, t0));
    });
  });

  describe('#inNDays', () => {
    it('should return a date n days in the future', () => {
      const t = DT.inNDays(42);
      expect(t - today).to.equal(42 * aDayInMs + dstDiff(t, today));
      expect(t.toTimeString().substring(0, 8)).to.equal('00:00:00');
    });

    it('should return a date n days in the past', () => {
      const t = DT.inNDays(-42);
      expect(today - t).to.equal(42 * aDayInMs + dstDiff(today, t));
      expect(t.toTimeString().substring(0, 8)).to.equal('00:00:00');
    });
  });

  describe('#tomorrow', () => {
    it('should return the start of tomorrow', () => {
      const t = DT.tomorrow();
      expect(t - today).to.equal(aDayInMs + dstDiff(t, today));
      expect(t.toTimeString().substring(0, 8)).to.equal('00:00:00');
    });
  });

  describe('#yesterday', () => {
    it('should return the start of yesterday', () => {
      const t = DT.yesterday();
      expect(today - t).to.equal(aDayInMs + dstDiff(today, t));
      expect(t.toTimeString().substring(0, 8)).to.equal('00:00:00');
    });
  });

  describe('#inNWeeks', () => {
    it('should return a date n weeks in the future', () => {
      const t = DT.inNWeeks(42);
      expect(t - today).to.equal(42 * aWeekInMs + dstDiff(t, today));
      expect(t.toTimeString().substring(0, 8)).to.equal('00:00:00');
    });

    it('should return a date n weeks in the past', () => {
      const t = DT.inNWeeks(-42);
      expect(today - t).to.equal(42 * aWeekInMs + dstDiff(today, t));
      expect(t.toTimeString().substring(0, 8)).to.equal('00:00:00');
    });
  });

  describe('#lastDayOfMonth', () => {
    it('should return the last day of the current month', () => {
      const t = DT.lastDayOfMonth();
      expect(t.getYear()).to.equal(today.getYear());
      expect(t.getMonth()).to.equal(today.getMonth());
      const daysInCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      expect(t.getDate()).to.equal(daysInCurrentMonth);
      expect(t.toTimeString().substring(0, 8)).to.equal('00:00:00');
    });
  });

  describe('#inNMonths', () => {
    it('should return a date n months in the future', () => {
      const t = DT.inNMonths(42);
      // The behaviour of what this function should do when we're at the end of
      // the month and the new month has fewer days is a bit ill-defined anyway.
      if (today.getDate() <= 28) {
        expect(t.getDate()).to.equal(today.getDate());
        expect(t.getMonth()).to.equal((today.getMonth() + 42) % 12);
        expect(t.getYear()).to.equal(today.getYear() + Math.floor((today.getMonth() + 42) / 12));
      }
      expect(t.toTimeString().substring(0, 8)).to.equal('00:00:00');
    });

    it('should return a date n months in the past', () => {
      const t = DT.inNMonths(-42); // 3.5 years
      // The behaviour of what this function should do when we're at the end of
      // the month and the new month has fewer days is a bit ill-defined anyway.
      if (today.getDate() <= 28) {
        expect(t.getDate()).to.equal(today.getDate());
        expect(t.getMonth()).to.equal((today.getMonth() - 42) % 12);
        expect(t.getYear()).to.equal(today.getYear() + Math.floor((today.getMonth() - 42) / 12));
      }
      expect(t.toTimeString().substring(0, 8)).to.equal('00:00:00');
    });
  });

  describe('#endOfDay', () => {
    it('should return the given date, but at 23:59', () => {
      const t0 = sampleDatetime();
      const t1 = DT.endOfDay(t0);
      expect(t1.toDateString()).to.equal(t0.toDateString());
      expect(t1.toTimeString().substring(0, 8)).to.equal('23:59:00');
    });
  });

  describe('#firstDayOfWeek', () => {
    it('should return today if given the same weekday as today', () => {
      const weekDay = (today.getDay() + 6) % 7; // Make it Monday-indexed
      const t = DT.firstDayOfWeek(weekDay);
      expect(t - today).to.equal(0);
    });

    it('should return the first given weekday after today', () => {
      const weekDay = Math.floor(Math.random() * 7);
      const t = DT.firstDayOfWeek(weekDay);
      expect(t - today).to.be.lessThan(aWeekInMs + dstDiff(t, today));
      expect(t - today - dstDiff(t, today))
        .to.equal(((t.getDay() - today.getDay() + 7) % 7) * aDayInMs);
    });
  });

  describe('#firstDayAndHourAfter', () => {
    it('should return the exact same date as given if requested', () => {
      const t0 = sampleDatetime();
      t0.setMinutes(0);
      t0.setSeconds(0);
      t0.setMilliseconds(0);
      const t1 = DT.firstDayAndHourAfter(t0, (t0.getDay() + 6) % 7, t0.getHours());
      expect(t1 - t0).to.equal(0);
    });

    it('should return a week from now if the requested week time is slighty in the past', () => {
      const t0 = sampleDatetime();
      t0.setMinutes(1);
      t0.setSeconds(0);
      t0.setMilliseconds(0);
      const t1 = DT.firstDayAndHourAfter(t0, (t0.getDay() + 6) % 7, t0.getHours());
      expect(t1 - t0).to.equal(aWeekInMs - aMinuteInMs + dstDiff(t1, t0));
    });

    it('should return the given day and hour after or equal to the given date', () => {
      const t0 = sampleDatetime();
      const dayOfWeek = Math.floor(Math.random() * 7);
      const hour = Math.floor(Math.random() * 24);
      const t1 = DT.firstDayAndHourAfter(t0, dayOfWeek, hour);
      expect(t1 - t0).to.be.within(0, aWeekInMs - 1);
      expect((t1.getDay() + 6) % 7).to.equal(dayOfWeek);
      expect(t1.getHours()).to.equal(hour);
    });
  });

  describe('#formatDatetime', () => {
    it("should drop the hour if it's the end of the day", () => {
      const t = DT.endOfDay(sampleDatetime());
      expect(DT.formatDatetime(t)).to.not.have.string(':');
    });

    it("should just show the hour if it's today", () => {
      const startOfToday = today.getTime();
      const endOfToday = DT.endOfDay(today).getTime();
      const t = new Date(startOfToday + Math.floor(Math.random() * (endOfToday - startOfToday)));
      const format = DT.formatDatetime(t);
      expect(format).to.match(/^\d+:\d+$/);
    });

    it('should just show "Today" if it\'s the end of today', () => {
      expect(DT.formatDatetime(DT.endOfDay(today))).to.equal('Today');
    });

    it('should show "Tomorrow" for tomorrow', () => {
      expect(DT.formatDatetime(DT.tomorrow())).to.equal('Tomorrow 0:00');
    });

    it('should show "Yesterday" for yesterday', () => {
      expect(DT.formatDatetime(DT.yesterday())).to.equal('Yesterday 0:00');
    });

    it('should show the day of the week in the next 2 to 6 days', () => {
      const dDays = Math.floor(Math.random() * 5 + 2);
      const t = DT.inNDays(dDays);
      const dayOfWeekStr = t.toDateString().substring(0, 3);
      const format = DT.formatDatetime(t);
      expect(format).to.equal(`${dayOfWeekStr} 0:00`);
    });

    it('should show the day of the week for the past 2 to 6 days', () => {
      const dDays = -Math.floor(Math.random() * 5 + 2);
      const t = DT.inNDays(dDays);
      const dayOfWeekStr = t.toDateString().substring(0, 3);
      const format = DT.formatDatetime(t);
      expect(format).to.equal(`Past ${dayOfWeekStr} 0:00`);
    });

    it('should show the date if its further than a week away', () => {
      const dDays = Math.floor(Math.random() * 80 + 7);
      const t = DT.addHours(DT.inNDays(dDays), 20);
      const format = DT.formatDatetime(t);
      expect(format).to.match(/\d+\/\d+ 20:00/);
    });
  });

  describe('#formatDuration', () => {
    it("should only show minutes if it's within the hour", () => {
      const durationInMin = Math.floor(Math.random() * 60);
      const format = DT.formatDuration(durationInMin * 60);
      expect(format).to.equal(`${durationInMin}m`);
    });

    it("should only show hours if it's a round hour", () => {
      const durationInHours = Math.floor(Math.random() * 100);
      const format = DT.formatDuration(durationInHours * 60 * 60);
      expect(format).to.equal(`${durationInHours}h`);
    });

    it('should show hours and minutes in all other cases', () => {
      const hours = Math.floor(Math.random() * 99 + 1);
      const minutes = Math.floor(Math.random() * 59 + 1);
      const format = DT.formatDuration((hours * 60 + minutes) * 60);
      expect(format).to.equal(`${hours}h${minutes}`);
    });
  });
});
