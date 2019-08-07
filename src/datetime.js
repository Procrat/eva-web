export const oneWeekInS = 7 * 24 * 60 * 60;
export const oneWeekInMs = oneWeekInS * 1000;

function stripTime(datetime) {
  return new Date(
    datetime.getFullYear(),
    datetime.getMonth(),
    datetime.getDate(),
  );
}

function copy(date) {
  return new Date(date.getTime());
}

export function addHours(datetime, hours) {
  const newDatetime = copy(datetime);
  newDatetime.setHours(datetime.getHours() + hours);
  return newDatetime;
}

export function today() {
  return stripTime(new Date());
}

export function addDays(date, days) {
  const newDate = copy(date);
  newDate.setDate(date.getDate() + days);
  return newDate;
}

export function inNDays(n) {
  return addDays(today(), n);
}

export function yesterday() {
  return inNDays(-1);
}

export function tomorrow() {
  return inNDays(1);
}

export function inNWeeks(n) {
  return addDays(today(), n * 7);
}

export function lastDayOfMonth() {
  const lastDay = today();
  lastDay.setMonth(lastDay.getMonth() + 1, 0);
  return lastDay;
}

function addMonths(date, months) {
  const newDate = copy(date);
  newDate.setMonth(date.getMonth() + months);
  return newDate;
}

export function inNMonths(n) {
  return addMonths(today(), n);
}

export function endOfDay(datetime) {
  return new Date(
    datetime.getFullYear(),
    datetime.getMonth(),
    datetime.getDate(),
    23,
    59,
  );
}

/**
 * Returns the first date after or equal to the given point in time,
 * corresponding to the given day of the week.
 */
function firstDayOfWeekAfter(datetime, dayOfWeek) {
  // Weeks should start on Monday: 0 = Monday; 6 = Sunday
  const currentWeekDay = (datetime.getDay() + 6) % 7;
  const wantedWeekDay = stripTime(datetime);
  wantedWeekDay.setDate(datetime.getDate() + ((dayOfWeek - currentWeekDay + 7) % 7));
  return wantedWeekDay;
}

/**
 * Returns today or the day in the next 6 days corresponding to the given day of
 * the week.
 */
export function firstDayOfWeek(dayOfWeek) {
  return firstDayOfWeekAfter(today(), dayOfWeek);
}

/**
 * Returns the first point in time after or equal to the given point in time,
 * corresponding to the given day of the week and hour.
 */
export function firstDayAndHourAfter(datetime, day, hour) {
  let newDatetime;
  if (day === (datetime.getDay() + 6) % 7) {
    newDatetime = stripTime(datetime);
    // Ensure that we return a date _after_ datetime, even if it's the same day.
    if (hour < datetime.getHours()
        || (hour === datetime.getHours() && datetime.getMinutes() > 0)) {
      newDatetime.setDate(datetime.getDate() + 7);
    }
  } else {
    newDatetime = firstDayOfWeekAfter(datetime, day);
  }
  newDatetime.setHours(hour);
  return newDatetime;
}


// === FORMATTING FUNCTIONS ===

export function formatDatetime(datetime) {
  const date = stripTime(datetime);
  let dateStr;
  if (date.getTime() === today().getTime()) {
    dateStr = '';
  } else if (date.getTime() === tomorrow().getTime()) {
    dateStr = 'Tomorrow';
  } else if (today().getTime() < date.getTime() && date.getTime() < inNWeeks(1).getTime()) {
    dateStr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  } else if (date.getTime() === yesterday().getTime()) {
    dateStr = 'Yesterday';
  } else if (inNWeeks(-1).getTime() < date.getTime() && date.getTime() < today().getTime()) {
    dateStr = `Past ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}`;
  } else {
    dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
  }

  let timeStr = `${datetime.getHours()}:${datetime.getMinutes().toString().padStart(2, '0')}`;
  if (timeStr === '23:59') {
    timeStr = '';
  }

  let datetimeStr = `${dateStr} ${timeStr}`.trim();
  if (datetimeStr === '') {
    datetimeStr = 'Today';
  }
  return datetimeStr;
}

export function formatDuration(durationSeconds) {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor(durationSeconds / 60) % 60;
  if (hours > 0) {
    return `${hours}h${minutes === 0 ? '' : minutes}`;
  }
  return `${minutes}m`;
}
