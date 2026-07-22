import React, { useState, useEffect } from 'react';
import { 
  Car, Plus, Trash2, ShoppingCart, RefreshCw, LogIn, UserPlus, 
  Search, Shield, LogOut, SlidersHorizontal, DollarSign, Tag, Info
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

export default function App() {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Vehicles State
  const [vehicles, setVehicles] = useState([]);
  const [searchMake, setSearchMake] = useState('');
  const [searchModel, setSearchModel] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchMinPrice, setSearchMinPrice] = useState('');
  const [searchMaxPrice, setSearchMaxPrice] = useState('');
  
  // Admin Form State (Add / Edit)
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMake, setFormMake] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formError, setFormError] = useState('');

  // Admin Restock State
  const [restockVehicleId, setRestockVehicleId] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState('');

  // Parse Token to check if admin
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      }
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
    }
  }, [token, currentUser]);

  // Fetch Vehicles
  const fetchVehicles = async () => {
    try {
      const params = new URLSearchParams();
      if (searchMake) params.append('make', searchMake);
      if (searchModel) params.append('model', searchModel);
      if (searchCategory) params.append('category', searchCategory);
      if (searchMinPrice) params.append('min_price', searchMinPrice);
      if (searchMaxPrice) params.append('max_price', searchMaxPrice);

      const res = await fetch(`${API_BASE}/vehicles?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [searchMake, searchModel, searchCategory, searchMinPrice, searchMaxPrice]);

  // Login / Register Form submission
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isRegistering) {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword }),
        });
        const data = await res.json();
        if (res.ok) {
          setIsRegistering(false);
          setAuthError('Registration successful! Please login.');
        } else {
          setAuthError(data.detail || 'Registration failed');
        }
      } else {
        const formData = new URLSearchParams();
        formData.append('username', authEmail);
        formData.append('password', authPassword);

        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          setToken(data.access_token);
          // Set role based on email hint
          setCurrentUser({
            email: authEmail,
            isAdmin: authEmail.startsWith('admin@')
          });
          setAuthEmail('');
          setAuthPassword('');
        } else {
          setAuthError(data.detail || 'Login failed');
        }
      }
    } catch (err) {
      setAuthError('Server error occurred');
    }
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  };

  // Add or Edit Vehicle (Admin Only)
  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const payload = {
      make: formMake,
      model: formModel,
      category: formCategory,
      price: parseFloat(formPrice),
      quantity: parseInt(formQuantity),
    };

    try {
      const url = editingVehicle 
        ? `${API_BASE}/vehicles/${editingVehicle.id}`
        : `${API_BASE}/vehicles`;
      const method = editingVehicle ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setShowFormModal(false);
        setEditingVehicle(null);
        clearForm();
        fetchVehicles();
      } else {
        setFormError(data.detail || 'Operation failed');
      }
    } catch (err) {
      setFormError('Server error occurred');
    }
  };

  const clearForm = () => {
    setFormMake('');
    setFormModel('');
    setFormCategory('');
    setFormPrice('');
    setFormQuantity('');
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormMake(vehicle.make);
    setFormModel(vehicle.model);
    setFormCategory(vehicle.category);
    setFormPrice(vehicle.price);
    setFormQuantity(vehicle.quantity);
    setShowFormModal(true);
  };

  // Delete Vehicle (Admin Only)
  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        fetchVehicles();
      } else {
        const data = await res.json();
        alert(data.detail || 'Delete failed');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Purchase Vehicle
  const handlePurchaseVehicle = async (id) => {
    if (!token) {
      alert('Please log in first to purchase a vehicle.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/vehicles/${id}/purchase`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        fetchVehicles();
      } else {
        const data = await res.json();
        alert(data.detail || 'Purchase failed');
      }
    } catch (err) {
      console.error('Purchase error:', err);
    }
  };

  // Restock Vehicle (Admin Only)
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/vehicles/${restockVehicleId}/restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: parseInt(restockQuantity) }),
      });
      if (res.ok) {
        setRestockVehicleId(null);
        setRestockQuantity('');
        fetchVehicles();
      } else {
        const data = await res.json();
        alert(data.detail || 'Restock failed');
      }
    } catch (err) {
      console.error('Restock error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/30">
              <Car className="h-6 w-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              AutoMax
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {token && currentUser ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-400 hidden sm:inline flex items-center gap-1">
                  {currentUser.isAdmin && <Shield className="h-4 w-4 text-amber-500 inline" />}
                  Logged in as <strong className="text-slate-200">{currentUser.email}</strong>
                </span>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition text-sm font-medium text-slate-300"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="text-sm text-slate-400">
                Not logged in
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left column: Login / Register & Filters */}
        <div className="lg:col-span-1 space-y-6">
          {/* Auth Section */}
          {!token && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200">
                {isRegistering ? <UserPlus className="h-5 w-5 text-blue-500" /> : <LogIn className="h-5 w-5 text-blue-500" />}
                {isRegistering ? 'Create Account' : 'Sign In'}
              </h2>
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Email</label>
                  <input 
                    type="email" 
                    required 
                    value={authEmail} 
                    onChange={e => setAuthEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Password</label>
                  <input 
                    type="password" 
                    required 
                    value={authPassword} 
                    onChange={e => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none transition"
                  />
                </div>
                
                {authError && (
                  <div className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                    {authError}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-500 transition text-white rounded-xl py-2 text-sm font-semibold shadow-lg shadow-blue-500/20"
                >
                  {isRegistering ? 'Register' : 'Login'}
                </button>
              </form>
              <div className="mt-4 text-center">
                <button 
                  onClick={() => { setIsRegistering(!isRegistering); setAuthError(''); }}
                  className="text-xs text-blue-400 hover:underline transition"
                >
                  {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </div>
          )}

          {/* Filters Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200">
              <SlidersHorizontal className="h-5 w-5 text-blue-500" />
              Filter Search
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Make</label>
                <input 
                  type="text" 
                  value={searchMake} 
                  onChange={e => setSearchMake(e.target.value)}
                  placeholder="e.g. Toyota"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Model</label>
                <input 
                  type="text" 
                  value={searchModel} 
                  onChange={e => setSearchModel(e.target.value)}
                  placeholder="e.g. Camry"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Category</label>
                <input 
                  type="text" 
                  value={searchCategory} 
                  onChange={e => setSearchCategory(e.target.value)}
                  placeholder="e.g. Sedan"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Min Price</label>
                  <input 
                    type="number" 
                    value={searchMinPrice} 
                    onChange={e => setSearchMinPrice(e.target.value)}
                    placeholder="Min"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Max Price</label>
                  <input 
                    type="number" 
                    value={searchMaxPrice} 
                    onChange={e => setSearchMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Vehicle Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              Vehicle Inventory
              <span className="text-sm bg-slate-800 text-slate-400 font-semibold px-2 py-0.5 rounded-full">
                {vehicles.length}
              </span>
            </h1>

            {currentUser?.isAdmin && (
              <button 
                onClick={() => { setEditingVehicle(null); clearForm(); setShowFormModal(true); }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/20"
              >
                <Plus className="h-4 w-4" />
                Add Vehicle
              </button>
            )}
          </div>

          {vehicles.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-slate-600" />
              <p className="text-lg font-medium text-slate-400">No vehicles match your query</p>
              <p className="text-sm">Try broadening your filter criteria or register to add one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {vehicles.map(vehicle => (
                <div key={vehicle.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition duration-300 flex flex-col group">
                  <div className="p-6 flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {vehicle.category}
                      </span>
                      <span className={`text-xs font-bold ${vehicle.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {vehicle.quantity > 0 ? `${vehicle.quantity} Available` : 'Out of Stock'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-2xl font-black text-white">
                        ${vehicle.price.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-800 flex items-center gap-2 justify-end">
                    {/* User Actions */}
                    <button
                      onClick={() => handlePurchaseVehicle(vehicle.id)}
                      disabled={vehicle.quantity <= 0}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed hover:bg-emerald-500 transition text-white px-3 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/10"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Buy Now
                    </button>

                    {/* Admin Actions */}
                    {currentUser?.isAdmin && (
                      <>
                        <button
                          onClick={() => { setRestockVehicleId(vehicle.id); setRestockQuantity(''); }}
                          className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-xl transition text-slate-300 border border-slate-700"
                          title="Restock"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(vehicle)}
                          className="bg-slate-800 hover:bg-slate-750 p-2.5 rounded-xl transition text-slate-300 border border-slate-750"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="bg-rose-550/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition p-2.5 rounded-xl"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin Add/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h2 className="text-xl font-bold text-slate-100 mb-4">
              {editingVehicle ? 'Edit Vehicle Info' : 'Add New Vehicle'}
            </h2>
            <form onSubmit={handleVehicleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Make</label>
                  <input 
                    type="text" 
                    required 
                    value={formMake} 
                    onChange={e => setFormMake(e.target.value)}
                    placeholder="Toyota"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Model</label>
                  <input 
                    type="text" 
                    required 
                    value={formModel} 
                    onChange={e => setFormModel(e.target.value)}
                    placeholder="Corolla"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Category</label>
                <input 
                  type="text" 
                  required 
                  value={formCategory} 
                  onChange={e => setFormCategory(e.target.value)}
                  placeholder="Sedan, SUV, Electric..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Price ($)</label>
                  <input 
                    type="number" 
                    required 
                    step="0.01"
                    value={formPrice} 
                    onChange={e => setFormPrice(e.target.value)}
                    placeholder="25000"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Quantity</label>
                  <input 
                    type="number" 
                    required 
                    value={formQuantity} 
                    onChange={e => setFormQuantity(e.target.value)}
                    placeholder="5"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none transition"
                  />
                </div>
              </div>

              {formError && (
                <div className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 transition rounded-xl text-sm font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 transition rounded-xl text-sm font-semibold text-white shadow-lg shadow-blue-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Restock Modal */}
      {restockVehicleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Restock Inventory</h2>
            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Quantity to add</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  value={restockQuantity} 
                  onChange={e => setRestockQuantity(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none transition"
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setRestockVehicleId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 transition rounded-xl text-sm font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 transition rounded-xl text-sm font-semibold text-white shadow-lg shadow-emerald-500/20"
                >
                  Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tips panel */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 text-left">
            <Info className="h-4 w-4 text-blue-500 shrink-0" />
            <span>Tip: Log in with an email starting with <code className="text-slate-400">admin@</code> (e.g. <code className="text-slate-400">admin@automax.com</code>) to unlock full CRUD & restocking controls.</span>
          </div>
          <span>&copy; 2026 AutoMax Dealership System.</span>
        </div>
      </footer>
    </div>
  );
}
