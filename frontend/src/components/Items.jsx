import { useState, useEffect } from 'react';
import { itemAPI, storeAPI } from '../services/api';
import './Items.css';

const Items = () => {
  const [items, setItems] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    store_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsRes, storesRes] = await Promise.all([
        itemAPI.getAll(),
        storeAPI.getAll(),
      ]);
      setItems(itemsRes.data);
      setStores(storesRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
        store_id: parseInt(formData.store_id),
      };
      const response = await itemAPI.create(itemData);
      setItems([...items, response.data]);
      resetForm();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create item');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    
    try {
      const itemData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
      };
      const response = await itemAPI.update(editingItem.id, itemData);
      setItems(items.map(item => item.id === editingItem.id ? response.data : item));
      resetForm();
      setError('');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.description || 'Failed to update item';
      setError(errorMessage);
      console.error('Update error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await itemAPI.delete(id);
      setItems(items.filter(item => item.id !== id));
      setError('');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.description || 'Failed to delete item';
      if (err.response?.status === 401) {
        setError('Admin privileges required to delete items. ' + errorMessage);
      } else {
        setError(errorMessage);
      }
    }
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      price: item.price ? parseFloat(item.price).toString() : '',
      store_id: item.store_id ? item.store_id.toString() : '',
    });
    setShowForm(true);
    // Scroll to form
    setTimeout(() => {
      const form = document.querySelector('.create-form');
      if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', store_id: '' });
    setEditingItem(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading">Loading items...</div>;
  }

  return (
    <div className="items-container">
      <div className="page-header">
        <h1>Items</h1>
        <button onClick={() => {
          if (showForm) {
            resetForm();
          } else {
            resetForm();
            setShowForm(true);
          }
        }} className="btn btn-primary">
          {showForm ? 'Cancel' : '+ New Item'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form onSubmit={editingItem ? handleUpdate : handleCreate} className="create-form">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Item name"
            required
            autoFocus
          />
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="Price"
            required
          />
          <select
            value={formData.store_id}
            onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
            required
          >
            <option value="">Select a store</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingItem ? 'Update Item' : 'Create Item'}
            </button>
            {editingItem && (
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          <p>No items yet. Create your first item!</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map(item => (
            <div key={item.id} className="item-card">
              <div className="item-header">
                <h3>{item.name}</h3>
                <div className="item-actions">
                  <button
                    onClick={() => startEdit(item)}
                    className="btn btn-secondary btn-small"
                    title="Edit item"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="btn btn-danger btn-small"
                    title="Delete item"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="item-info">
                <p className="item-price">${parseFloat(item.price).toFixed(2)}</p>
                <p className="item-store">Store: {item.store?.name || 'N/A'}</p>
                {item.tags && item.tags.length > 0 && (
                  <div className="item-tags">
                    {item.tags.map(tag => (
                      <span key={tag.id} className="tag-badge">{tag.name}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Items;

