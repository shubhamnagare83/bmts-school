import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function GradeRuleManagement() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setData([
        { id: 1, name: 'A+', min: 91, max: 100, order: 1, color: 'bg-green-100 text-green-800' },
        { id: 2, name: 'A', min: 81, max: 90, order: 2, color: 'bg-green-50 text-green-700' },
        { id: 3, name: 'B+', min: 71, max: 80, order: 3, color: 'bg-blue-100 text-blue-800' },
        { id: 4, name: 'B', min: 61, max: 70, order: 4, color: 'bg-blue-50 text-blue-700' },
        { id: 5, name: 'C', min: 51, max: 60, order: 5, color: 'bg-yellow-100 text-yellow-800' },
        { id: 6, name: 'F', min: 0, max: 50, order: 6, color: 'bg-red-100 text-red-800' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Grade Rules</h1>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          <Plus size={18} /> Add Grade Rule
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max %</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Display Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-4">Loading...</td></tr>
            ) : data.map(item => (
              <tr key={item.id}>
                <td className="px-6 py-4 text-sm font-bold">
                  <span className={`px-3 py-1 rounded ${item.color}`}>{item.name}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.min}%</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.max}%</td>
                <td className="px-6 py-4 text-sm text-gray-500">{item.order}</td>
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
