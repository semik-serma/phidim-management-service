'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Noto_Sans } from 'next/font/google';
import {
  FiAlertCircle,
  FiBox,
  FiCheck,
  FiClock,
  FiDownload,
  FiEdit,
  FiFileText,
  FiFilter,
  FiMinus,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTag,
  FiTrash2,
  FiTrendingUp,
  FiX,
  FiHome,
  FiCreditCard,
  FiBookOpen,
  FiUsers,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import UserAvatar from '@/components/UserAvatar';
import ProfileModal from '@/components/ProfileModal';
import Sidebar, { MobileNav } from '@/components/Sidebar';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getCategories,
  createCategory,
  deleteCategory,
} from '@/lib/productApi';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const CATEGORIES = [
  'All',
  'CCTV',
  'Networking',
  'Electrical',
  'Plumbing',
  'Computer',
  'Service',
  'General',
];

const UNITS = ['pcs', 'meter', 'roll', 'set', 'pkt', 'box', 'service'];

export default function ProductsPage() {
  const { user, loading: authLoading, logout, updatePicture } = useAuth();
  const router = useRouter();

  const userRole = (user?.role || 'staff').toLowerCase();
  const isAdmin = userRole === 'admin';

  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState('All'); // 'All' | 'inStock' | 'lowStock' | 'outOfStock'
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'priceAsc' | 'priceDesc' | 'stockDesc'

  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Category management state
  const [categories, setCategories] = useState([
    'CCTV',
    'Networking',
    'Electrical',
    'Plumbing',
    'Computer',
    'Service',
    'General',
  ]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isQuickAddCategoryOpen, setIsQuickAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'CCTV',
    price: '',
    costPrice: '',
    unit: 'pcs',
    stock: '',
    minStockAlert: 5,
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchProductList = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      if (data && Array.isArray(data.products)) {
        setProducts(data.products);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryList = async () => {
    try {
      const list = await getCategories();
      if (Array.isArray(list) && list.length > 0) {
        setCategoriesData(list);
        const names = Array.from(new Set(list.map((c) => c.name))).filter(Boolean);
        setCategories(names);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    fetchProductList();
    fetchCategoryList();
  }, []);

  const handleCreateQuickCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error('Please enter a category name');
      return;
    }
    setCreatingCategory(true);
    try {
      const created = await createCategory({ name: trimmed });
      toast.success(`Category "${created.name}" created!`);
      await fetchCategoryList();
      setFormData((prev) => ({ ...prev, category: created.name }));
      setNewCategoryName('');
      setIsQuickAddCategoryOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleCreateCategoryFull = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      toast.error('Please enter a category name');
      return;
    }
    setCreatingCategory(true);
    try {
      const created = await createCategory({
        name: trimmed,
        description: newCategoryDesc.trim(),
      });
      toast.success(`Category "${created.name}" created successfully!`);
      await fetchCategoryList();
      setNewCategoryName('');
      setNewCategoryDesc('');
    } catch (err) {
      toast.error(err.message || 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    setDeletingCategoryId(id);
    try {
      await deleteCategory(id);
      toast.success(`Category "${name}" deleted`);
      if (categoryFilter === name) setCategoryFilter('All');
      if (formData.category === name) {
        setFormData((prev) => ({ ...prev, category: categories[0] || 'General' }));
      }
      await fetchCategoryList();
    } catch (err) {
      toast.error(err.message || 'Failed to delete category');
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const openAddModal = () => {
    if (!isAdmin) {
      toast.error('Only administrators can add new products to inventory.');
      return;
    }
    setEditingProduct(null);
    setFormData({
      name: '',
      code: '',
      category: 'CCTV',
      price: '',
      costPrice: '',
      unit: 'pcs',
      stock: '10',
      minStockAlert: 5,
      description: '',
    });
    setIsProductModalOpen(true);
  };

  const openEditModal = (prod) => {
    if (!isAdmin) {
      toast.error('Only administrators can edit product details.');
      return;
    }
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      code: prod.code || '',
      category: prod.category || 'General',
      price: prod.price !== undefined ? String(prod.price) : '',
      costPrice: prod.costPrice !== undefined ? String(prod.costPrice) : '',
      unit: prod.unit || 'pcs',
      stock: prod.stock !== undefined ? String(prod.stock) : '0',
      minStockAlert: prod.minStockAlert !== undefined ? Number(prod.minStockAlert) : 5,
      description: prod.description || '',
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (formData.price === '' || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      toast.error('Valid selling price/rate is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        category: formData.category,
        price: Number(formData.price),
        costPrice: formData.costPrice ? Number(formData.costPrice) : 0,
        unit: formData.unit,
        stock: formData.stock !== '' ? Number(formData.stock) : 0,
        minStockAlert: Number(formData.minStockAlert) || 5,
        description: formData.description.trim(),
      };

      if (editingProduct) {
        await updateProduct(editingProduct._id || editingProduct.id, payload);
        toast.success('Product updated successfully!');
      } else {
        await createProduct(payload);
        toast.success('Product added to inventory!');
      }

      setIsProductModalOpen(false);
      fetchProductList();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProduct(deletingProduct._id || deletingProduct.id);
      toast.success('Product removed from inventory');
      setDeletingProduct(null);
      fetchProductList();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete product');
    }
  };

  const handleQuickStock = async (prod, delta) => {
    try {
      await adjustStock(prod._id || prod.id, { delta });
      toast.success(delta > 0 ? `+${delta} restocked` : `${delta} stock deducted`);
      fetchProductList();
    } catch {
      toast.error('Failed to update stock');
    }
  };

  // Filtered & Sorted list
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (categoryFilter !== 'All') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    if (stockFilter === 'inStock') {
      result = result.filter((p) => Number(p.stock) > 5);
    } else if (stockFilter === 'lowStock') {
      result = result.filter((p) => Number(p.stock) > 0 && Number(p.stock) <= (Number(p.minStockAlert) || 5));
    } else if (stockFilter === 'outOfStock') {
      result = result.filter((p) => Number(p.stock) <= 0);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.code?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'priceAsc') return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === 'priceDesc') return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === 'stockDesc') return Number(b.stock || 0) - Number(a.stock || 0);
      return (a.name || '').localeCompare(b.name || '');
    });

    return result;
  }, [products, categoryFilter, stockFilter, search, sortBy]);

  const handleExportExcel = () => {
    try {
      const csvHeader = 'Name,Code/SKU,Category,Unit,Selling Price,Cost Price,Stock,Description\n';
      const csvRows = filteredProducts.map((p) =>
        `"${p.name || ''}","${p.code || ''}","${p.category || ''}","${p.unit || ''}",${p.price || 0},${p.costPrice || 0},${p.stock || 0},"${(p.description || '').replace(/"/g, '""')}"`
      );
      const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvHeader + csvRows.join('\n'));
      const link = document.createElement('a');
      link.setAttribute('href', csvContent);
      link.setAttribute('download', `Phidim_Products_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Inventory exported to CSV!');
    } catch {
      toast.error('Failed to export inventory');
    }
  };

  return (
    <div className={`${notoSans.className} min-h-screen flex bg-[#F0F4FA] text-[#0B1F3A]`}>
      {/* Desktop Sidebar */}
      <Sidebar user={user} onProfileClick={() => setIsProfileOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Nav Header */}
        <MobileNav user={user} onProfileClick={() => setIsProfileOpen(true)} />

        {/* Top Action Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 bg-[#FFD600] px-5 py-3 sm:px-6 sm:py-3.5 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#072A44] text-[#FFD600]">
              <FiPackage className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-[#072A44] leading-tight">
                Products & Inventory Management
              </h1>
              <p className="text-xs font-semibold text-[#072A44]/80">
                Manage supplies, equipment, prices, and stock for billing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#072A44]/30 bg-white/80 px-3.5 py-2 text-xs font-bold text-[#072A44] hover:bg-white transition cursor-pointer"
                  title="Manage and create product categories"
                >
                  <FiTag className="h-3.5 w-3.5 text-[#0B5ED7]" />
                  Categories
                </button>
                <button
                  type="button"
                  onClick={openAddModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#072A44] px-4 py-2 text-xs font-bold text-[#FFD600] shadow-sm hover:bg-[#0A3D63] transition cursor-pointer"
                >
                  <FiPlus className="h-4 w-4" />
                  Add Product
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#072A44]/30 bg-white/70 px-3.5 py-2 text-xs font-bold text-[#072A44] hover:bg-white transition cursor-pointer"
            >
              <FiDownload className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </header>

        {/* Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Items</span>
                <span className="p-2 rounded-xl bg-[#0B5ED7]/10 text-[#0B5ED7]">
                  <FiBox className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900">{stats.totalProducts}</p>
              <p className="text-xs text-slate-500 mt-0.5">Active product SKUs</p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Stock Units</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <FiShoppingBag className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-emerald-600">{stats.totalStock.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total units available in shop</p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inventory Valuation</span>
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <FiTrendingUp className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-indigo-600">Rs. {stats.totalValue.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-0.5">Estimated sales value</p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Low / Out of Stock</span>
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <FiAlertCircle className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-rose-600">
                {stats.lowStockCount + stats.outOfStockCount}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {stats.outOfStockCount > 0 ? `${stats.outOfStockCount} out of stock` : 'Requires restock soon'}
              </p>
            </div>
          </div>

          {/* Search, Categories, and Filters Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
            {/* Search Input & Sort */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search products by name, code, SKU, or details..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0B5ED7] focus:bg-white transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0B5ED7]"
                >
                  <option value="name">Sort: Name (A-Z)</option>
                  <option value="priceAsc">Price: Low to High</option>
                  <option value="priceDesc">Price: High to Low</option>
                  <option value="stockDesc">Stock: High to Low</option>
                </select>

                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0B5ED7]"
                >
                  <option value="All">Stock: All Items</option>
                  <option value="inStock">In Stock (&gt; 5)</option>
                  <option value="lowStock">Low Stock (1-5)</option>
                  <option value="outOfStock">Out of Stock (0)</option>
                </select>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
                <FiTag className="h-3.5 w-3.5" /> Category:
              </span>
              {['All', ...categories].map((cat) => {
                const isSelected = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#072A44] text-[#FFD600] font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-[#0B5ED7] hover:bg-blue-100 border border-blue-200 transition cursor-pointer flex items-center gap-1 ml-auto"
                  title="Manage and create categories"
                >
                  <FiPlus className="h-3.5 w-3.5" /> Manage Categories
                </button>
              )}
            </div>
          </div>

          {/* Products List Table */}
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Inventory Catalog</h2>
                <span className="rounded-full bg-[#0B5ED7]/10 px-2.5 py-0.5 text-xs font-bold text-[#0B5ED7]">
                  {filteredProducts.length} items
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Products automatically sync with Bill Entry for quick selection
              </p>
            </div>

            {loading ? (
              <div className="py-16 text-center text-slate-400 font-semibold text-xs">
                <FiRefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#0B5ED7]" />
                Loading inventory catalog...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <FiPackage className="h-10 w-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No products match your filters</p>
                <p className="text-xs text-slate-500">Try adjusting your search query or category filter</p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#0B5ED7] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0A4FB3] transition cursor-pointer"
                  >
                    <FiPlus className="h-3.5 w-3.5" /> Add First Product
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-5">Code / SKU</th>
                      <th className="py-3.5 px-4">Product Name</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Unit</th>
                      <th className="py-3.5 px-4 text-right">Selling Rate</th>
                      {isAdmin && <th className="py-3.5 px-4 text-right">Cost Price</th>}
                      <th className="py-3.5 px-5 text-center">Stock Level</th>
                      <th className="py-3.5 px-4 text-center">Quick Stock</th>
                      {isAdmin && <th className="py-3.5 px-5 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredProducts.map((prod) => {
                      const stockNum = Number(prod.stock || 0);
                      const minAlert = Number(prod.minStockAlert || 5);
                      const isOut = stockNum <= 0;
                      const isLow = stockNum > 0 && stockNum <= minAlert;

                      return (
                        <tr key={prod._id || prod.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-5 font-mono text-xs font-bold text-slate-600 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                              {prod.code || '—'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 max-w-[260px]">
                            <p className="font-bold text-slate-900">{prod.name}</p>
                            {prod.description && (
                              <p className="text-[11px] text-slate-400 truncate">{prod.description}</p>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#072A44]/5 text-[#072A44] border border-[#072A44]/10">
                              {prod.category || 'General'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 uppercase font-semibold text-xs whitespace-nowrap">
                            {prod.unit || 'pcs'}
                          </td>

                          <td className="py-3.5 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                            Rs. {Number(prod.price || 0).toLocaleString()}
                          </td>

                          {isAdmin && (
                            <td className="py-3.5 px-4 text-right text-slate-500 font-semibold whitespace-nowrap">
                              Rs. {Number(prod.costPrice || 0).toLocaleString()}
                            </td>
                          )}

                          <td className="py-3.5 px-5 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                isOut
                                  ? 'bg-rose-100 text-rose-700'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isOut ? 'bg-rose-600' : isLow ? 'bg-amber-600' : 'bg-emerald-600'
                                }`}
                              />
                              {stockNum} {prod.unit || 'pcs'}
                            </span>
                          </td>

                          {/* Quick Stock adjustments */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleQuickStock(prod, -1)}
                                disabled={stockNum <= 0}
                                className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition disabled:opacity-40 cursor-pointer"
                                title="Decrease stock by 1"
                              >
                                <FiMinus className="h-3 w-3" />
                              </button>
                              <span className="px-2 text-xs font-bold text-slate-700">{stockNum}</span>
                              <button
                                type="button"
                                onClick={() => handleQuickStock(prod, 1)}
                                className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                                title="Increase stock by 1"
                              >
                                <FiPlus className="h-3 w-3" />
                              </button>
                            </div>
                          </td>

                          {/* Actions */}
                          {isAdmin && (
                            <td className="py-3.5 px-5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(prod)}
                                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                                  title="Edit product details"
                                >
                                  <FiEdit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingProduct(prod)}
                                  className="rounded-lg border border-rose-200 bg-rose-50/70 p-1.5 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                                  title="Delete product"
                                >
                                  <FiTrash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0B5ED7] text-white">
                  <FiPackage className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingProduct ? 'Edit Product Details' : 'Add New Inventory Product'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Will appear in Bill Entry autocomplete & stock lists
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="rounded-xl border border-slate-300 bg-white p-2 text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hikvision 2MP Dome Camera"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Code / SKU
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CAM-01"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsQuickAddCategoryOpen(!isQuickAddCategoryOpen)}
                        className="text-[11px] font-bold text-[#0B5ED7] hover:underline flex items-center gap-0.5 cursor-pointer"
                        title="Add a new category to database"
                      >
                        <FiPlus className="h-3 w-3" /> + New Category
                      </button>
                    )}
                  </div>

                  {isQuickAddCategoryOpen && (
                    <div className="mb-2 p-2 rounded-xl border border-blue-200 bg-blue-50/80 flex items-center gap-1.5 animate-in fade-in">
                      <input
                        type="text"
                        placeholder="New category name..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateQuickCategory();
                          }
                        }}
                        className="flex-1 rounded-lg border border-blue-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
                        autoFocus
                      />
                      <button
                        type="button"
                        disabled={creatingCategory || !newCategoryName.trim()}
                        onClick={handleCreateQuickCategory}
                        className="px-2.5 py-1 rounded-lg bg-[#0B5ED7] text-white text-[11px] font-bold hover:bg-[#0A4FB3] transition cursor-pointer disabled:opacity-50"
                      >
                        {creatingCategory ? 'Saving...' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickAddCategoryOpen(false);
                          setNewCategoryName('');
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                      >
                        <FiX className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0B5ED7]"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Selling Rate (Rs) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Cost Price (Rs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0B5ED7]"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Initial Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Low Stock Alert At
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="5"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description / Specification
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional details, brand, warranty, or technical specs..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0B5ED7]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B5ED7] px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-[#0B5ED7]/25 hover:bg-[#0A4FB3] transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 p-6 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <FiTrash2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Delete Product from Inventory?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <span className="font-bold text-slate-800">{deletingProduct.name}</span>?
                This will remove it from the product catalog.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE CATEGORIES MODAL (Admin Only) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#0B5ED7]/10 text-[#0B5ED7]">
                  <FiTag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Product Categories
                  </h3>
                  <p className="text-xs text-slate-500">
                    Create and manage inventory categories stored in database
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-5 my-4 pr-1">
              {/* Create Category Form */}
              <div className="rounded-2xl border border-blue-100 bg-[#F4F8FD] p-4 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#072A44] flex items-center gap-1.5">
                  <FiPlus className="text-[#0B5ED7]" /> Add New Category
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      placeholder="Category Name *"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0B5ED7]"
                    />
                  </div>
                  <div className="sm:col-span-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Description (optional)..."
                      value={newCategoryDesc}
                      onChange={(e) => setNewCategoryDesc(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCategoryFull();
                        }
                      }}
                      className="flex-1 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#0B5ED7]"
                    />
                    <button
                      type="button"
                      disabled={creatingCategory || !newCategoryName.trim()}
                      onClick={handleCreateCategoryFull}
                      className="px-4 py-2 rounded-xl bg-[#0B5ED7] text-white text-xs font-bold shadow-md shadow-[#0B5ED7]/25 hover:bg-[#0A4FB3] transition cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {creatingCategory ? 'Creating...' : '+ Create'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Categories List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  <span>Category ({categoriesData.length})</span>
                  <span>Products / Actions</span>
                </div>

                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
                  {categoriesData.map((cat) => (
                    <div
                      key={cat._id || cat.id || cat.name}
                      className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-900">
                            {cat.name}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0B5ED7]">
                            {cat.productCount || 0} items
                          </span>
                        </div>
                        {cat.description && (
                          <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {cat.productCount > 0 ? (
                          <span
                            className="text-[11px] text-slate-400 font-medium px-2 py-1"
                            title="Cannot delete while products belong to this category"
                          >
                            In Use
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat._id || cat.id, cat.name)}
                            disabled={deletingCategoryId === (cat._id || cat.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer disabled:opacity-40"
                            title={`Delete category "${cat.name}"`}
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {categoriesData.length === 0 && (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No categories found. Default categories will be generated.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="rounded-xl bg-[#072A44] px-5 py-2 text-xs font-bold text-white hover:bg-[#0A3D63] transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdatePicture={updatePicture}
      />
    </div>
  );
}
