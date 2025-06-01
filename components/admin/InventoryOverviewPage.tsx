
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, SizeStock } from '../../types';
import { productService } from '../../services/productService';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { SearchIcon } from '../icons/SearchIcon'; // Assuming SearchIcon exists

const LOW_STOCK_THRESHOLD = 10;

interface StockUpdateStateEntry {
  currentStockInput: string;
  isUpdating: boolean;
  error?: string;
  originalStock: number;
}
interface StockUpdateStates {
  [productSizeKey: string]: StockUpdateStateEntry; // Key: "productId-sizeName"
}

export const InventoryOverviewPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stockUpdateStates, setStockUpdateStates] = useState<StockUpdateStates>({});
  const [searchTermInventory, setSearchTermInventory] = useState<string>('');


  const initializeStockUpdateStates = (loadedProducts: Product[]) => {
    const initialStates: StockUpdateStates = {};
    loadedProducts.forEach(product => {
      product.sizes.forEach(size => {
        const key = `${product.id}-${size.size}`;
        initialStates[key] = {
          currentStockInput: String(size.stock),
          isUpdating: false,
          error: undefined,
          originalStock: size.stock,
        };
      });
    });
    setStockUpdateStates(initialStates);
  };

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const adminProducts = await productService.fetchAllProductsAdmin();
      setProducts(adminProducts);
      initializeStockUpdateStates(adminProducts);
    } catch (err) {
      setError('Failed to load product inventory.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleStockInputChange = (productId: string, sizeName: string, value: string) => {
    const key = `${productId}-${sizeName}`;
    setStockUpdateStates(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] || { originalStock: 0, isUpdating: false }), 
        currentStockInput: value,
        error: undefined, 
      }
    }));
  };

  const handleUpdateStock = async (productId: string, sizeName: string) => {
    const key = `${productId}-${sizeName}`;
    const state = stockUpdateStates[key];
    if (!state) return;

    const newStock = parseInt(state.currentStockInput, 10);

    if (isNaN(newStock) || newStock < 0) {
      setStockUpdateStates(prev => ({
        ...prev,
        [key]: { ...prev[key], error: "Stock must be a non-negative number." }
      }));
      return;
    }

    setStockUpdateStates(prev => ({
      ...prev,
      [key]: { ...prev[key], isUpdating: true, error: undefined }
    }));

    try {
      const updatedProduct = await productService.updateProductStockAdmin(productId, sizeName, newStock);
      if (updatedProduct) {
        setProducts(prevProds => prevProds.map(p => p.id === productId ? updatedProduct : p));
        const updatedSizeInfo = updatedProduct.sizes.find(s => s.size === sizeName);
        const currentNewStock = updatedSizeInfo ? updatedSizeInfo.stock : 0;

        setStockUpdateStates(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            isUpdating: false,
            currentStockInput: String(currentNewStock), 
            originalStock: currentNewStock,
          }
        }));
      } else {
        throw new Error("Product or size not found, or update failed on the server.");
      }
    } catch (err) {
      console.error(`Error updating stock for ${productId}, size ${sizeName}:`, err);
      setStockUpdateStates(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          isUpdating: false,
          error: "Failed to update stock. Please try again.",
          currentStockInput: String(prev[key]?.originalStock ?? 0), 
        }
      }));
    }
  };
  
  const filteredInventoryProducts = useMemo(() => {
    if (!searchTermInventory) {
      return products;
    }
    const lowerSearchTerm = searchTermInventory.toLowerCase();
    return products.filter(product =>
      product.title.toLowerCase().includes(lowerSearchTerm) ||
      product.code.toLowerCase().includes(lowerSearchTerm)
    );
  }, [products, searchTermInventory]);

  const inventorySummary = useMemo(() => {
    const currentProductList = filteredInventoryProducts; // Use filtered list for summary
    const totalProducts = currentProductList.length;
    const totalItemsInStock = currentProductList.reduce((sum, product) => sum + (product.totalStock ?? 0), 0);
    const outOfStockCount = currentProductList.filter(p => (p.totalStock ?? 0) === 0).length;
    const lowStockCount = currentProductList.filter(p => (p.totalStock ?? 0) > 0 && (p.totalStock ?? 0) <= LOW_STOCK_THRESHOLD).length;
    return { totalProducts, totalItemsInStock, outOfStockCount, lowStockCount };
  }, [filteredInventoryProducts]);

  const getStockLevelClass = (stock: number): string => {
    if (stock === 0) return 'text-red-600 font-semibold';
    if (stock <= LOW_STOCK_THRESHOLD) return 'text-orange-600 font-semibold';
    return 'text-green-600';
  };

  if (isLoading) {
    return <p className="text-center text-gray-500 py-8">Loading inventory data...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-8 bg-red-50 rounded-md">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800">Inventory Overview</h2>

      <div className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input
            label="Search Product (Title, Code)"
            id="inventorySearch"
            placeholder="Enter title or code..."
            value={searchTermInventory}
            onChange={(e) => setSearchTermInventory(e.target.value)}
            containerClassName="w-full md:col-span-2"
            leftIcon={<SearchIcon className="w-4 h-4 text-gray-400" />}
          />
          <Button
            onClick={() => setSearchTermInventory('')}
            variant="secondary"
            size="md"
            disabled={!searchTermInventory}
            className="w-full md:w-auto"
          >
            Clear Search
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="bg-indigo-50 p-4 rounded-lg shadow">
          <p className="text-sm text-indigo-700 font-medium">Displaying Products</p>
          <p className="text-2xl font-bold text-indigo-900">{inventorySummary.totalProducts}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <p className="text-sm text-green-700 font-medium">Items in Stock (Filtered)</p>
          <p className="text-2xl font-bold text-green-900">{inventorySummary.totalItemsInStock}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg shadow">
          <p className="text-sm text-orange-700 font-medium">Low Stock (≤{LOW_STOCK_THRESHOLD} total)</p>
          <p className="text-2xl font-bold text-orange-900">{inventorySummary.lowStockCount}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow">
          <p className="text-sm text-red-700 font-medium">Out of Stock (total)</p>
          <p className="text-2xl font-bold text-red-900">{inventorySummary.outOfStockCount}</p>
        </div>
      </div>

      {filteredInventoryProducts.length === 0 ? (
        <p className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-md">
          {searchTermInventory ? `No products found for "${searchTermInventory}".` : "No products found in the inventory."}
        </p>
      ) : (
        <div className="flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300" aria-label="Inventory Stock Levels">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Product Title</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Code</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Size</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 min-w-[180px]">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredInventoryProducts.map((product) => (
                      product.sizes.length > 0 ? product.sizes.map((size, index) => {
                        const key = `${product.id}-${size.size}`;
                        const state = stockUpdateStates[key] || { currentStockInput: String(size.stock), originalStock: size.stock, isUpdating: false };
                        return (
                          <tr key={key} className="hover:bg-gray-50 transition-colors duration-150">
                            {index === 0 && ( 
                              <>
                                <td rowSpan={product.sizes.length} className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 align-top border-b">{product.title}</td>
                                <td rowSpan={product.sizes.length} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 align-top border-b">{product.code}</td>
                              </>
                            )}
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{size.size}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  id={`stock-${key}`}
                                  name={`stock-${key}`}
                                  value={state.currentStockInput}
                                  onChange={(e) => handleStockInputChange(product.id, size.size, e.target.value)}
                                  min="0"
                                  className={`w-20 text-sm text-center ${getStockLevelClass(parseInt(state.currentStockInput, 10))}`}
                                  aria-label={`Stock for ${product.title} size ${size.size}`}
                                  disabled={state.isUpdating}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateStock(product.id, size.size)}
                                  disabled={
                                    state.isUpdating ||
                                    parseInt(state.currentStockInput, 10) === state.originalStock
                                  }
                                  variant={parseInt(state.currentStockInput, 10) === state.originalStock ? "secondary" : "primary"}
                                >
                                  {state.isUpdating ? 'Saving...' : 'Update'}
                                </Button>
                              </div>
                              {state.error && (
                                <p className="text-xs text-red-500 mt-1">{state.error}</p>
                              )}
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                           <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{product.title}</td>
                           <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.code}</td>
                           <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 italic">No sizes defined</td>
                           <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 italic">N/A</td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
