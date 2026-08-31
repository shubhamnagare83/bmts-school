import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function ExamManagement() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData([
        { id: 1, name: 'Term 1', class: 'Class 1', startDate: '2023-09-01', endDate: '2023-09-15', status: 'Completed' },
        { id: 2, name: 'Term 2', class: 'Class 1', startDate: '2024-03-01', endDate: '2024-03-15', status: 'Upcoming' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Exam Management</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          <Plus size={18} /> Add Exam
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
            ) : data.map(item => (
              <tr key={item.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.class}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.startDate}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.endDate}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-medium flex gap-3">
                  <button className="text-blue-600 hover:text-blue-900"><Edit size={18}/></button>
                  <button className="text-red-600 hover:text-red-900"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
