import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function SubjectManagement() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData([
        { id: 1, name: 'Mathematics', code: 'MATH101', maxMarks: 100, passingMarks: 35, displayOrder: 1, active: true },
        { id: 2, name: 'English', code: 'ENG101', maxMarks: 100, passingMarks: 35, displayOrder: 2, active: true },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Subject Management</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          <Plus size={18} /> Add Subject
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Class</label>
        <select className="border p-2 rounded w-64">
          <option>Class 1</option>
          <option>Class 2</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Marks</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passing</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
            ) : data.map(item => (
              <tr key={item.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.code}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.maxMarks}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.passingMarks}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.displayOrder}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <input type="checkbox" checked={item.active} readOnly className="h-4 w-4 text-blue-600 rounded" />
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
