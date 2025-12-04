import { useState, useEffect } from 'react';
import { tagAPI, storeAPI, itemAPI } from '../services/api';
import './Tags.css';

const Tags = () => {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [tags, setTags] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [newTagName, setNewTagName] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      loadTagsAndItems();
    }
  }, [selectedStore]);

  const loadStores = async () => {
    try {
      setLoading(true);
      const response = await storeAPI.getAll();
      setStores(response.data);
      if (response.data.length > 0 && !selectedStore) {
        setSelectedStore(response.data[0].id);
      }
      setError('');
    } catch (err) {
      setError('Failed to load stores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTagsAndItems = async () => {
    if (!selectedStore) return;

    try {
      setLoading(true);
      const [tagsRes, itemsRes] = await Promise.all([
        tagAPI.getByStore(selectedStore),
        itemAPI.getAll(),
      ]);
      setTags(tagsRes.data);
      setItems(itemsRes.data.filter(item => item.store_id === selectedStore));
      setError('');
    } catch (err) {
      setError('Failed to load tags');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const response = await tagAPI.create(selectedStore, newTagName.trim());
      setTags([...tags, response.data]);
      resetForm();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tag');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    try {
      const response = await tagAPI.update(editingTag.id, newTagName.trim());
      setTags(tags.map(tag => tag.id === editingTag.id ? response.data : tag));
      resetForm();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update tag');
    }
  };

  const startEdit = (tag) => {
    setEditingTag(tag);
    setNewTagName(tag.name);
    setShowForm(true);
  };

  const resetForm = () => {
    setNewTagName('');
    setEditingTag(null);
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tag?')) {
      return;
    }

    try {
      await tagAPI.delete(id);
      setTags(tags.filter(tag => tag.id !== id));
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete tag');
    }
  };

  const handleLinkTag = async (itemId, tagId) => {
    try {
      await tagAPI.linkToItem(itemId, tagId);
      await loadTagsAndItems();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to link tag to item');
    }
  };

  const handleUnlinkTag = async (itemId, tagId) => {
    try {
      await tagAPI.unlinkFromItem(itemId, tagId);
      await loadTagsAndItems();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unlink tag from item');
    }
  };

  if (loading && stores.length === 0) {
    return <div className="loading">Loading...</div>;
  }

  if (stores.length === 0) {
    return (
      <div className="tags-container">
        <h1>Tags</h1>
        <div className="empty-state">
          <p>No stores available. Create a store first!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tags-container">
      <div className="page-header">
        <h1>Tags</h1>
        <select
          value={selectedStore || ''}
          onChange={(e) => setSelectedStore(parseInt(e.target.value))}
          className="store-selector"
        >
          {stores.map(store => (
            <option key={store.id} value={store.id}>{store.name}</option>
          ))}
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tags-section">
        <div className="tags-header">
          <h2>Tags for Selected Store</h2>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn btn-primary">
            {showForm ? 'Cancel' : '+ New Tag'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={editingTag ? handleUpdate : handleCreate} className="create-form">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name"
              required
              autoFocus
            />
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingTag ? 'Update Tag' : 'Create Tag'}
              </button>
              {editingTag && (
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {tags.length === 0 ? (
          <div className="empty-state">
            <p>No tags for this store yet.</p>
          </div>
        ) : (
          <div className="tags-list">
            {tags.map(tag => (
              <div key={tag.id} className="tag-card">
                <div className="tag-header">
                  <span className="tag-name">{tag.name}</span>
                  <div className="tag-actions">
                    <button
                      onClick={() => startEdit(tag)}
                      className="btn btn-secondary btn-small"
                      title="Edit tag"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id)}
                      className="btn btn-danger btn-small"
                      title="Delete tag"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="tag-items">
                  <p><strong>Items with this tag:</strong></p>
                  {tag.items && tag.items.length > 0 ? (
                    <ul>
                      {tag.items.map(item => (
                        <li key={item.id}>{item.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-items">No items tagged yet</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="items-section">
        <h2>Link Tags to Items</h2>
        {items.length === 0 ? (
          <div className="empty-state">
            <p>No items in this store yet.</p>
          </div>
        ) : (
          <div className="items-list">
            {items.map(item => (
              <div key={item.id} className="item-link-card">
                <h3>{item.name}</h3>
                <div className="item-tags">
                  <p><strong>Current tags:</strong></p>
                  {item.tags && item.tags.length > 0 ? (
                    <div className="tag-badges">
                      {item.tags.map(tag => (
                        <span key={tag.id} className="tag-badge">
                          {tag.name}
                          <button
                            onClick={() => handleUnlinkTag(item.id, tag.id)}
                            className="tag-remove"
                            title="Remove tag"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="no-tags">No tags</p>
                  )}
                </div>
                <div className="link-tags">
                  <p><strong>Add tag:</strong></p>
                  <div className="tag-buttons">
                    {tags
                      .filter(tag => !item.tags || !item.tags.some(t => t.id === tag.id))
                      .map(tag => (
                        <button
                          key={tag.id}
                          onClick={() => handleLinkTag(item.id, tag.id)}
                          className="btn btn-secondary btn-small"
                        >
                          + {tag.name}
                        </button>
                      ))}
                    {(!item.tags || item.tags.length === tags.length) && (
                      <span className="no-more-tags">All tags linked</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tags;

