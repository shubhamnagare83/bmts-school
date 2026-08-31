import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function MarksOverview() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData([
        { id: 1, rollNo: '101', name: 'John Doe', obtained: 85, max: 100, percent: 85, grade: 'A', rank: 1 },
        { id: 2, rollNo: '102', name: 'Jane Smith', obtained: 70, max: 100, percent: 70, grade: 'B', rank: 2 },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Marks Overview</h1>

      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4">
        <select className="border p-2 rounded"><option>Academic Year</option></select>
        <select className="border p-2 rounded"><option>Exam</option></select>
        <select className="border p-2 rounded"><option>Class</option></select>
        <select className="border p-2 rounded"><option>Division</option></select>
        <select className="border p-2 rounded"><option>Subject</option></select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Class Average</p>
          <p className="text-2xl font-bold">77.5%</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Highest Score</p>
          <p className="text-2xl font-bold">85</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Lowest Score</p>
          <p className="text-2xl font-bold">70</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Pass Percentage</p>
          <p className="text-2xl font-bold">100%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">%</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
            ) : data.map(item => (
              <tr key={item.id}>
                <td className="px-6 py-4 text-sm text-gray-500">{item.rollNo}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.obtained} / {item.max}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.percent}%</td>
                <td className="px-6 py-4 text-sm text-gray-500 font-bold">{item.grade}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.rank}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
