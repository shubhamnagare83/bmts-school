export function computeWorkingDays(startDate: Date, endDate: Date, holidays: Date[]): number {
  let count = 0;
  const curDate = new Date(startDate);
  
  const holidayStrings = holidays.map(h => new Date(h).toDateString());

  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0) { // Exclude Sunday
      if (!holidayStrings.includes(curDate.toDateString())) {
        count++;
      }
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

export function computeAttendancePercentage(presentDays: number, workingDays: number): number {
  if (workingDays === 0) return 0;
  return Number(((presentDays / workingDays) * 100).toFixed(2));
}

export function computeGrade(percentage: number, rules: any[]): string {
  const rule = rules.find(r => percentage >= r.minPercentage && percentage <= r.maxPercentage);
  return rule ? rule.name : 'N/A';
}

export function generateCredentials(name: string): { username: string, passwordHash: string } {
  const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return {
    username: `${cleanName}${rand}`,
    passwordHash: 'defaultHashNeedBcrypt' 
  };
}
