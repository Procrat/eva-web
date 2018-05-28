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


export function formatDatetime(datetime) {
  const date = stripTime(datetime);
  let dateStr;
  if (date.getTime() === today().getTime()) {
    dateStr = '';
  } else if (date.getTime() === addDays(today(), 1).getTime()) {
    dateStr = 'Tomorrow';
  } else {
    dateStr = `${date.getDate()}/${date.getMonth() + 1}`;
  }

  let timeStr = `${datetime.getHours()}:`
    + `${datetime.getMinutes().toString().padStart(2, '0')}`;
  if (timeStr === '23:59') {
    timeStr = '';
  }

  let datetimeStr = [dateStr, timeStr].join(' ').trim();
  if (datetimeStr === '') {
    datetimeStr = 'Today';
  }
  return datetimeStr;
}

export function formatDuration(durationMinutes) {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  if (hours > 0) {
    return `${hours}h${minutes === 0 ? '' : minutes}`;
  }
  return `${minutes}m`;
}
