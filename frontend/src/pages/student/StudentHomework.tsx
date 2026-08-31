import React, { useEffect, useState } from 'react';
import { homeworkApi } from '@/api/homework';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { BookMarked, Calendar, CheckCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function StudentHomework() {
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    homeworkApi.getAll()
      .then((res) => {
        if (res.data.success) setHomeworkList(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Homework & Assignments</h1>
        <p className="text-slate-500 text-sm">View assigned tasks and submission deadlines</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-600" /> Class Homework Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : homeworkList.length === 0 ? (
            <p className="text-center py-12 text-slate-500 text-sm">No homework currently assigned.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {homeworkList.map((hw) => (
                <div key={hw.id} className="p-4 border border-slate-200 rounded-xl bg-white space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      {hw.subject?.name}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800 text-base">{hw.title}</h3>
                    <p className="text-xs text-slate-500">Teacher: {hw.teacher?.name}</p>
                  </div>

                  {hw.description && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {hw.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
