import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function ClassManagement() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    displayOrder: '',
    reportCardTemplate: 'KG'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setTimeout(() => {
        setClasses([
          { id: 1, name: 'LKG', displayOrder: 1, reportCardTemplate: 'KG', divisions: ['A', 'B'], subjectCount: 5 },
          { id: 2, name: 'Class 1', displayOrder: 3, reportCardTemplate: 'PRIMARY_SECONDARY', divisions: ['A', 'B', 'C'], subjectCount: 6 }
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
      setFormData({ name: item.name, displayOrder: item.displayOrder, reportCardTemplate: item.reportCardTemplate });
    } else {
      setFormData({ name: '', displayOrder: '', reportCardTemplate: 'KG' });
    }
    setShowModal(true);
  };

  const handleSave = () => {
    toast.success(editingItem ? 'Class updated' : 'Class added');
    setShowModal(false);
    fetchData();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Class Management</h1>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          <Plus size={18} /> Add Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading...</p>
        ) : classes.map((cls) => (
          <div key={cls.id} className="bg-white rounded-lg shadow p-5 border-t-4 border-blue-600">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{cls.name}</h3>
                <p className="text-xs text-gray-500">Template: {cls.reportCardTemplate}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => handleOpenModal(cls)} className="text-gray-500 hover:text-blue-600"><Edit size={16}/></button>
              </div>
            </div>
            
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Divisions</h4>
              <div className="flex flex-wrap gap-2">
                {cls.divisions.map((div: string, idx: number) => (
                  <span key={idx} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                    {div}
                    <button className="text-red-500 hover:text-red-700 ml-1"><XCircle size={12} /></button>
                  </span>
                ))}
                <button className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-medium border border-dashed border-blue-300 hover:bg-blue-100">
                  + Add
                </button>
              </div>
            </div>

            <div className="border-t pt-3 mt-3">
              <p className="text-sm text-blue-600 hover:underline cursor-pointer font-medium">
                View Subjects ({cls.subjectCount})
              </p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingItem ? 'Edit Class' : 'Add Class'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Class Name</label>
                <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Order</label>
                <input type="number" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" value={formData.displayOrder} onChange={(e) => setFormData({...formData, displayOrder: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Report Card Template</label>
                <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" value={formData.reportCardTemplate} onChange={(e) => setFormData({...formData, reportCardTemplate: e.target.value})}>
                  <option value="KG">KG Template</option>
                  <option value="PRIMARY_SECONDARY">Primary/Secondary Template</option>
                </select>
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

const XCircle = ({size}: {size: number}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
)
