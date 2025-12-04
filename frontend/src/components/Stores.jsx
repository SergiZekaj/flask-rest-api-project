import { useState, useEffect } from 'react';
import { storeAPI } from '../services/api';
import './Stores.css';

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [newStoreName, setNewStoreName] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);
      const response = await storeAPI.getAll();
      setStores(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load stores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    try {
      const response = await storeAPI.create(newStoreName.trim());
      setStores([...stores, response.data]);
      resetForm();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create store');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    try {
      const response = await storeAPI.update(editingStore.id, newStoreName.trim());
      setStores(stores.map(store => store.id === editingStore.id ? response.data : store));
      resetForm();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update store');
    }
  };

  const startEdit = (store) => {
    setEditingStore(store);
    setNewStoreName(store.name);
    setShowForm(true);
  };

  const resetForm = () => {
    setNewStoreName('');
    setEditingStore(null);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this store? This will also delete all items and tags in it.')) {
      return;
    }

    try {
      await storeAPI.delete(id);
      setStores(stores.filter(store => store.id !== id));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete store');
    }
  };

  if (loading) {
    return <div className="loading">Loading stores...</div>;
  }

  return (
    <div className="stores-container">
      <div className="page-header">
        <h1>Stores</h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ New Store'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={editingStore ? handleUpdate : handleCreate} className="create-form">
          <input
            type="text"
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
            placeholder="Store name"
            required
            autoFocus
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingStore ? 'Update Store' : 'Create Store'}
            </button>
            {editingStore && (
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {stores.length === 0 ? (
        <div className="empty-state">
          <p>No stores yet. Create your first store!</p>
        </div>
      ) : (
        <div className="stores-grid">
          {stores.map(store => (
            <div key={store.id} className="store-card">
              <div className="store-header">
                <h2>{store.name}</h2>
                <div className="store-actions">
                  <button
                    onClick={() => startEdit(store)}
                    className="btn btn-secondary btn-small"
                    title="Edit store"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDelete(store.id)}
                    className="btn btn-danger btn-small"
                    title="Delete store"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="store-info">
                <p><strong>Items:</strong> {store.items?.length || 0}</p>
                <p><strong>Tags:</strong> {store.tags?.length || 0}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Stores;

