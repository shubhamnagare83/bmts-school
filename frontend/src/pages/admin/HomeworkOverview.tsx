import React, { useEffect, useState } from 'react';
import { homeworkApi } from '@/api/homework';
import { classesApi } from '@/api/classes';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { BookMarked, Calendar, User, CheckCircle2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function HomeworkOverview() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    classesApi.getAll().then((res) => {
      if (res.data.success) {
        setClasses(res.data.data);
      }
    });
  }, []);

  useEffect(() => {
    fetchHomework();
  }, [selectedClassId]);

  const fetchHomework = () => {
    setLoading(true);
    const params = selectedClassId ? { classId: selectedClassId } : {};
    homeworkApi.getAll(params)
      .then((res) => {
        if (res.data.success) {
          setHomeworkList(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Homework & Assignment Overview</h1>
          <p className="text-slate-500 text-sm">Monitor homework assigned across classes and subjects</p>
        </div>
        <div className="w-56">
          <Select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Class {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-indigo-600" /> Assigned Homework Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : homeworkList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No homework assignments recorded.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {homeworkList.map((hw) => (
                <div key={hw.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-sm bg-white space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      Class {hw.class?.name} - {hw.division?.name}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-800 text-base">{hw.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Subject: {hw.subject?.name}</p>
                  </div>

                  {hw.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded">
                      {hw.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" /> {hw.teacher?.name}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {hw._count?.submissions || 0} Submissions
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
