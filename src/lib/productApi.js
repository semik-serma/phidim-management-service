import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function unwrap(response) {
  if (response && response.data !== undefined) {
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  }
  return response;
}

const FALLBACK_PRODUCTS_KEY = 'phidim_inventory_products';

const DEFAULT_LOCAL_PRODUCTS = [
  {
    _id: 'prod-1',
    name: 'Hikvision 2MP Dome CCTV Camera',
    code: 'CAM-01',
    category: 'CCTV',
    price: 3200,
    costPrice: 2600,
    unit: 'pcs',
    stock: 24,
    minStockAlert: 5,
    description: 'High definition 1080p IR indoor dome camera',
  },
  {
    _id: 'prod-2',
    name: 'Hikvision 2MP Bullet Outdoor CCTV Camera',
    code: 'CAM-02',
    category: 'CCTV',
    price: 3600,
    costPrice: 2900,
    unit: 'pcs',
    stock: 18,
    minStockAlert: 4,
    description: 'IP67 weather resistant bullet camera for outdoor security',
  },
  {
    _id: 'prod-3',
    name: 'Cat6 Pure Copper Network Cable (Roll 305m)',
    code: 'NET-01',
    category: 'Networking',
    price: 11500,
    costPrice: 9200,
    unit: 'roll',
    stock: 8,
    minStockAlert: 2,
    description: 'High speed gigabit data transmission UTP Cat6 wire',
  },
  {
    _id: 'prod-4',
    name: 'Cat6 Ethernet Patch Cable / Meter',
    code: 'NET-02',
    category: 'Networking',
    price: 45,
    costPrice: 25,
    unit: 'meter',
    stock: 250,
    minStockAlert: 50,
    description: 'Custom cut Cat6 network wire per meter',
  },
  {
    _id: 'prod-5',
    name: 'RJ45 Gold Plated Connectors (Pack of 50)',
    code: 'NET-03',
    category: 'Networking',
    price: 650,
    costPrice: 400,
    unit: 'pkt',
    stock: 15,
    minStockAlert: 3,
    description: 'Standard modular 8P8C crimping connectors',
  },
  {
    _id: 'prod-6',
    name: '1.5mm Multi-Strand House Wiring Wire (Roll)',
    code: 'EL-01',
    category: 'Electrical',
    price: 4800,
    costPrice: 4100,
    unit: 'roll',
    stock: 14,
    minStockAlert: 3,
    description: 'Flame retardant copper wire for lighting & fans',
  },
  {
    _id: 'prod-7',
    name: '2.5mm Multi-Strand Power Wiring Wire (Roll)',
    code: 'EL-02',
    category: 'Electrical',
    price: 7200,
    costPrice: 6200,
    unit: 'roll',
    stock: 10,
    minStockAlert: 3,
    description: 'Heavy duty copper wire for power outlets and kitchen circuits',
  },
  {
    _id: 'prod-8',
    name: 'Modular 6-Gang Switch & Socket Board',
    code: 'EL-03',
    category: 'Electrical',
    price: 850,
    costPrice: 600,
    unit: 'set',
    stock: 35,
    minStockAlert: 10,
    description: 'Modern flush mount white finish modular wall board',
  },
  {
    _id: 'prod-9',
    name: 'CPVC 1-Inch Hot & Cold Water Pipe',
    code: 'PL-01',
    category: 'Plumbing',
    price: 620,
    costPrice: 480,
    unit: 'pcs',
    stock: 30,
    minStockAlert: 6,
    description: 'SDR 11 high temperature drinking water pipe (3 meter)',
  },
  {
    _id: 'prod-10',
    name: 'Brass Concealed Stop Cock Valve',
    code: 'PL-02',
    category: 'Plumbing',
    price: 1250,
    costPrice: 950,
    unit: 'pcs',
    stock: 12,
    minStockAlert: 4,
    description: 'Heavy brass quarter turn water isolation valve',
  },
  {
    _id: 'prod-11',
    name: 'Domestic Appliance Repair & Diagnostics Service',
    code: 'SRV-01',
    category: 'Service',
    price: 1500,
    costPrice: 0,
    unit: 'service',
    stock: 999,
    minStockAlert: 0,
    description: 'On-site inspection, diagnostic testing and repair labor charge',
  },
  {
    _id: 'prod-12',
    name: 'CCTV Camera Installation & Alignment Service',
    code: 'SRV-02',
    category: 'Service',
    price: 800,
    costPrice: 0,
    unit: 'service',
    stock: 999,
    minStockAlert: 0,
    description: 'Per camera mounting, cable termination, and angle tuning',
  },
];

function getStoredLocalProducts() {
  if (typeof window === 'undefined') return DEFAULT_LOCAL_PRODUCTS;
  try {
    const raw = localStorage.getItem(FALLBACK_PRODUCTS_KEY);
    if (!raw) {
      localStorage.setItem(FALLBACK_PRODUCTS_KEY, JSON.stringify(DEFAULT_LOCAL_PRODUCTS));
      return DEFAULT_LOCAL_PRODUCTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_LOCAL_PRODUCTS;
  } catch {
    return DEFAULT_LOCAL_PRODUCTS;
  }
}

function saveLocalProducts(products) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FALLBACK_PRODUCTS_KEY, JSON.stringify(products));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

/**
 * Fetch all products from API or local fallback
 */
export async function getProducts(params = {}) {
  try {
    const response = await api.get('/products', { params });
    const resData = unwrap(response);
    if (resData && Array.isArray(resData.products)) {
      saveLocalProducts(resData.products);
      return resData;
    }
    if (Array.isArray(resData)) {
      saveLocalProducts(resData);
      return { products: resData, stats: computeStats(resData) };
    }
  } catch (error) {
    console.warn('Backend /products offline, using local fallback:', error?.message);
  }

  // Local fallback
  const local = getStoredLocalProducts();
  let filtered = [...local];
  if (params.category && params.category !== 'All') {
    filtered = filtered.filter((p) => p.category === params.category);
  }
  if (params.q) {
    const qLower = params.q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name?.toLowerCase().includes(qLower) ||
        p.code?.toLowerCase().includes(qLower) ||
        p.description?.toLowerCase().includes(qLower)
    );
  }
  return { products: filtered, stats: computeStats(local) };
}

function computeStats(items = []) {
  const totalProducts = items.length;
  const totalStock = items.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
  const totalValue = items.reduce(
    (sum, p) => sum + (Number(p.stock) || 0) * (Number(p.price) || 0),
    0
  );
  const lowStockCount = items.filter(
    (p) => Number(p.stock) > 0 && Number(p.stock) <= (Number(p.minStockAlert) || 5)
  ).length;
  const outOfStockCount = items.filter((p) => Number(p.stock) <= 0).length;

  return { totalProducts, totalStock, totalValue, lowStockCount, outOfStockCount };
}

/**
 * Create a product (Admin only)
 */
export async function createProduct(productData) {
  try {
    const response = await api.post('/products', productData);
    const newProd = unwrap(response);
    const local = getStoredLocalProducts();
    saveLocalProducts([newProd, ...local]);
    return newProd;
  } catch (error) {
    // If backend offline, create locally
    const local = getStoredLocalProducts();
    const fallbackProd = {
      _id: `local-${Date.now()}`,
      ...productData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveLocalProducts([fallbackProd, ...local]);
    return fallbackProd;
  }
}

/**
 * Update a product (Admin only)
 */
export async function updateProduct(id, productData) {
  try {
    const response = await api.put(`/products/${id}`, productData);
    const updated = unwrap(response);
    const local = getStoredLocalProducts();
    const next = local.map((p) => (p._id === id || p.id === id ? { ...p, ...updated } : p));
    saveLocalProducts(next);
    return updated;
  } catch (error) {
    const local = getStoredLocalProducts();
    const next = local.map((p) =>
      p._id === id || p.id === id ? { ...p, ...productData, updatedAt: new Date().toISOString() } : p
    );
    saveLocalProducts(next);
    return { ...productData, _id: id };
  }
}

/**
 * Delete a product (Admin only)
 */
export async function deleteProduct(id) {
  try {
    const response = await api.delete(`/products/${id}`);
    const resData = unwrap(response);
    const local = getStoredLocalProducts();
    saveLocalProducts(local.filter((p) => p._id !== id && p.id !== id));
    return resData;
  } catch (error) {
    const local = getStoredLocalProducts();
    saveLocalProducts(local.filter((p) => p._id !== id && p.id !== id));
    return { id };
  }
}

/**
 * Quick stock adjustment
 */
export async function adjustStock(id, data) {
  try {
    const response = await api.patch(`/products/${id}/stock`, data);
    return unwrap(response);
  } catch (error) {
    const local = getStoredLocalProducts();
    const next = local.map((p) => {
      if (p._id === id || p.id === id) {
        let newStock = p.stock || 0;
        if (data.newStock !== undefined) newStock = Math.max(0, Number(data.newStock));
        else if (data.delta !== undefined) newStock = Math.max(0, newStock + Number(data.delta));
        return { ...p, stock: newStock };
      }
      return p;
    });
    saveLocalProducts(next);
    return { success: true };
  }
}
