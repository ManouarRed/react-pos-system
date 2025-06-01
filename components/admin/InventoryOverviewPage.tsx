
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, SizeStock } from '../../types';
import { productService } from '../../services/productService';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { SearchIcon } from '../icons/SearchIcon';
import { PencilIcon } from '../icons/PencilIcon';
import { InventoryStockEditModal } from './InventoryStockEditModal';

const LOW_STOCK_THRESHOLD = 10;

export const InventoryOverviewPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTermInventory, setSearchTermInventory] = useState<string>('');

  const [isStockEditModalOpen, setIsStockEditModalOpen] = useState<boolean>(false);
  const [productForStockEdit, setProductForStockEdit] = useState<Product | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  }

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    clearMessages();
    try {
      const adminProducts = await productService.fetchAllProductsAdmin();
      setProducts(adminProducts);
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
    const currentProductList = filteredInventoryProducts;
    const totalProducts = currentProductList.length;
    const totalItemsInStock = currentProductList.reduce((sum, product) => sum + (product.totalStock ?? 0), 0);
    const outOfStockCount = currentProductList.filter(p => (p.totalStock ?? 0) === 0).length;
    const lowStockCount = currentProductList.filter(p => (p.totalStock ?? 0) > 0 && (p.totalStock ?? 0) <= LOW_STOCK_THRESHOLD).length;
    return { totalProducts, totalItemsInStock, outOfStockCount, lowStockCount };
  }, [filteredInventoryProducts]);

  const getStockLevelClass = (totalStock: number): string => {
    if (totalStock === 0) return 'text-red-600 font-semibold';
    if (totalStock <= LOW_STOCK_THRESHOLD) return 'text-orange-600 font-semibold';
    return 'text-green-600';
  };

  const handleOpenStockEditModal = (product: Product) => {
    clearMessages();
    setProductForStockEdit(product);
    setIsStockEditModalOpen(true);
  };

  const handleCloseStockEditModal = () => {
    setProductForStockEdit(null);
    setIsStockEditModalOpen(false);
  };

  const handleSaveStockChangesFromModal = async (productId: string, updatedSizeStocks: SizeStock[]) => {
    clearMessages();
    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;
    const originalProduct = products.find(p => p.id === productId);
    if (!originalProduct) {
        setError("Original product not found for stock update.");
        setIsLoading(false);
        return;
    }

    for (const updatedSize of updatedSizeStocks) {
        const originalSize = originalProduct.sizes.find(s => s.size === updatedSize.size);
        if (originalSize && originalSize.stock !== updatedSize.stock) {
            try {
                const result = await productService.updateProductStockAdmin(productId, updatedSize.size, updatedSize.stock);
                if (result) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (err) {
                console.error(`Error updating stock for ${productId}, size ${updatedSize.size}:`, err);
                errorCount++;
            }
        } else if (!originalSize && updatedSize.stock > 0) {
            console.warn(`Attempted to update stock for a new size "${updatedSize.size}" for product ${productId}. This is not currently supported by direct modal editing.`);
        }
    }
    
    await loadProducts(); 
    handleCloseStockEditModal();

    if (successCount > 0 && errorCount === 0) {
        setSuccessMessage("Stock updated successfully for selected sizes.");
    } else if (errorCount > 0) {
        setError(`Stock update failed for ${errorCount} size(s). ${successCount > 0 ? `${successCount} size(s) updated.` : ''}`);
    } else {
        setSuccessMessage("No stock changes were made."); 
    }
    setIsLoading(false);
  };


  if (isLoading && products.length === 0) {
    return <p className="text-center text-gray-500 py-8">Loading inventory data...</p>;
  }

  const MessageDisplay = () => {
    if (error) return <p className="text-center text-red-500 py-4 bg-red-50 rounded-md my-4">{error}</p>;
    if (successMessage) return <p className="text-center text-green-500 py-4 bg-green-50 rounded-md my-4">{successMessage}</p>;
    return null;
  }

  return (
    <div className="space-y-6">
      <MessageDisplay />
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

      {isLoading && products.length > 0 && <p className="text-center text-gray-500 py-4">Updating inventory list...</p>}

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
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Category</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Manufacturer</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Total Stock</th>
                      <th scope="col" className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredInventoryProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{product.title}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.code}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.categoryName}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.manufacturerName}</td>
                        <td className={`whitespace-nowrap px-3 py-4 text-sm ${getStockLevelClass(product.totalStock ?? 0)}`}>
                          {product.totalStock ?? 0}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenStockEditModal(product)}
                            leftIcon={<PencilIcon className="w-4 h-4" />}
                            disabled={product.sizes.length === 0} // Disable if no sizes are defined to edit
                            title={product.sizes.length === 0 ? "No sizes defined for this product" : "Edit stock for all sizes"}
                          >
                            Edit Stock
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {isStockEditModalOpen && productForStockEdit && (
        <InventoryStockEditModal
          isOpen={isStockEditModalOpen}
          onClose={handleCloseStockEditModal}
          onSave={handleSaveStockChangesFromModal}
          product={productForStockEdit}
        />
      )}
    </div>
  );
};
