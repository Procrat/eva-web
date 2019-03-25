function stripTime(datetime) {
  return new Date(
    datetime.getFullYear(),
    datetime.getMonth(),
    datetime.getDate(),
  );
}

export function today() {
  return stripTime(new Date());
}

function addDays(date, days) {
  date.setDate(date.getDate() + days);
  return date;
}

export function tomorrow() {
  return addDays(today(), 1);
}

export function nextDayOfWeek(dayOfWeek) {
  // Weeks should start on Monday: 0 = Monday; 6 = Sunday
  const currentWeekDay = (today().getDay() + 6) % 7;
  const wantedWeekDay = today();
  wantedWeekDay.setDate(today().getDate() + (dayOfWeek - currentWeekDay));
  return wantedWeekDay;
}

export function inNDays(n) {
  return addDays(today(), n);
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
  date.setMonth(date.getMonth() + months);
  return date;
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


export function formatDatetime(datetime) {
  const date = stripTime(datetime);
  let dateStr;
  if (date.getTime() === today().getTime()) {
    dateStr = '';
  } else if (date.getTime() === tomorrow().getTime()) {
    dateStr = 'Tomorrow';
  } else if (date.getTime() < inNWeeks(1).getTime()) {
    dateStr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  } else {
    dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
  }

  let timeStr = `${datetime.getHours()}:`
    + `${datetime.getMinutes().toString().padStart(2, '0')}`;
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
