import React, { useEffect, useState } from 'react';
import { timetableApi } from '@/api/timetable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Clock } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function StudentTimetable() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    timetableApi.get()
      .then((res) => {
        if (res.data.success) setTimetable(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const getSlot = (dayIdx: number, periodNum: number) => {
    return timetable.find(
      (e) => e.dayOfWeek === dayIdx && e.periodNumber === periodNum
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Class Timetable</h1>
        <p className="text-slate-500 text-sm">Weekly schedule of subject periods and teachers</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" /> Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold">
                    <th className="p-3 border border-slate-200">Day / Period</th>
                    {PERIODS.map((p) => (
                      <th key={p} className="p-3 border border-slate-200">Period {p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day, dayIdx) => (
                    <tr key={day} className="hover:bg-slate-50">
                      <td className="p-3 border border-slate-200 font-semibold text-slate-800 bg-slate-50">
                        {day}
                      </td>
                      {PERIODS.map((periodNum) => {
                        const slot = getSlot(dayIdx, periodNum);
                        return (
                          <td key={periodNum} className="p-3 border border-slate-200">
                            {slot ? (
                              <div className="space-y-0.5">
                                <div className="font-bold text-indigo-900">{slot.subject?.name}</div>
                                <div className="text-[10px] text-slate-500">{slot.teacher?.name}</div>
                                {slot.room && <div className="text-[10px] text-slate-400">Rm: {slot.room}</div>}
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
