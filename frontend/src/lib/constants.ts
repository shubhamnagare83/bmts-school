export const ROLES = {
  ADMIN: 'ADMIN',
  FACULTY: 'FACULTY',
  STUDENT: 'STUDENT',
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  LEAVE: 'LEAVE',
} as const;

export const REPORT_CARD_STATUS = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  FINALIZED: 'FINALIZED',
} as const;

export const CLASS_NAMES = [
  'Nursery', 'Jr.KG', 'Sr.KG', 
  '1st', '2nd', '3rd', '4th', '5th', 
  '6th', '7th', '8th', '9th', '10th'
];
