import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function AcademicYearManagement() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setData([
          { id: 1, name: '2023-2024', startDate: '2023-04-01', endDate: '2024-03-31', isActive: false },
          { id: 2, name: '2024-2025', startDate: '2024-04-01', endDate: '2025-03-31', isActive: true }
        ]);
        setLoading(false);
      }, 500);
    } catch (err) {
      toast.error('Failed to load data');
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = (item: any = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({ name: item.name, startDate: item.startDate, endDate: item.endDate });
    } else {
      setFormData({ name: '', startDate: '', endDate: '' });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    toast.success(editingItem ? 'Academic Year updated' : 'Academic Year added');
    setShowModal(false);
    fetchData();
  };

  const handleActivate = (id: number) => {
    toast.success('Academic Year activated');
    fetchData();
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this?')) {
      toast.success('Academic Year deleted');
      fetchData();
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Academic Years</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <Plus size={18} /> Add Academic Year
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>
            ) : data.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.startDate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.endDate}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-3">
                    <button onClick={() => handleOpenModal(item)} className="text-blue-600 hover:text-blue-900" title="Edit"><Edit size={18}/></button>
                    {!item.isActive && (
                      <button onClick={() => handleActivate(item.id)} className="text-green-600 hover:text-green-900" title="Activate"><CheckCircle size={18}/></button>
                    )}
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900" title="Delete"><Trash2 size={18}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingItem ? 'Edit Academic Year' : 'Add Academic Year'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. 2024-2025" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setShowModal(false)} className="bg-white text-gray-700 px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
