
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, SaleItem, Category, PaymentMethod, SaleItemWithFinalPrice, SizeStock } from '../types';
import { PAYMENT_METHODS } from '../constants';
import { productService } from '../services/productService';
import { Input } from './common/Input';
import { Select } from './common/Select';
import { Button } from './common/Button';
import { SaleItemRow } from './SaleItemRow';
import { SearchIcon } from './icons/SearchIcon';
import { PlusIcon } from './icons/PlusIcon';

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
  return debounced as (...args: Parameters<F>) => ReturnType<F>;
}

const ALL_CATEGORIES_ID = "All Categories";

export const POSForm: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(ALL_CATEGORIES_ID);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState<boolean>(false);
  
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  
  const [submissionStatus, setSubmissionStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await productService.fetchCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    loadCategories();
  }, []);

  const debouncedSearch = useCallback(
    debounce(async (term: string, categoryIdToSearch: string) => {
      if (term.trim().length < 2 && categoryIdToSearch === ALL_CATEGORIES_ID) { 
        setSearchResults([]);
        setIsLoadingSearch(false);
        setShowSearchResults(false);
        return;
      }
      setIsLoadingSearch(true);
      try {
        const results = await productService.fetchProducts(term, categoryIdToSearch);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error("Error fetching products:", error);
        setSearchResults([]);
      } finally {
        setIsLoadingSearch(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm, selectedCategoryId);
  }, [searchTerm, selectedCategoryId, debouncedSearch]);

  const addProductToSale = (product: Product) => {
    if ((product.totalStock ?? 0) === 0) {
      alert(`${product.title} is out of stock.`);
      return;
    }

    // Default to the first size that has stock.
    let defaultSizeInfo: SizeStock | undefined = product.sizes.find(s => s.stock > 0);
    if (!defaultSizeInfo && product.sizes.length > 0) { // If all sizes are out of stock, pick first one
      defaultSizeInfo = product.sizes[0];
    }
    
    const defaultSizeName = defaultSizeInfo ? defaultSizeInfo.size : '';
    const defaultSizeStock = defaultSizeInfo ? defaultSizeInfo.stock : 0;

    if (defaultSizeStock === 0 && defaultSizeInfo) {
         alert(`${product.title} (Size: ${defaultSizeName}) is out of stock.`);
         return;
    }
     if (!defaultSizeInfo && product.sizes.length > 0) {
        alert(`${product.title} has no available sizes with stock.`);
        return;
    }


    const existingItemIndex = saleItems.findIndex(item => item.product.id === product.id && item.selectedSize === defaultSizeName);
    
    if (existingItemIndex > -1) {
        const existingItem = saleItems[existingItemIndex];
        const selectedSizeStockInfo = product.sizes.find(s => s.size === existingItem.selectedSize);
        const currentSelectedSizeStock = selectedSizeStockInfo ? selectedSizeStockInfo.stock : 0;

        if(existingItem.quantity < currentSelectedSizeStock) { 
            updateSaleItem(existingItemIndex, { ...existingItem, quantity: existingItem.quantity + 1 });
        } else {
            alert(`Max stock (${currentSelectedSizeStock}) reached for ${product.title}${defaultSizeName ? ` (Size: ${defaultSizeName})` : ''}.`);
        }
    } else {
        const newSaleItem: SaleItem = {
          id: `${product.id}-${Date.now()}`, 
          product, 
          selectedSize: defaultSizeName,
          quantity: 1, // Start with 1 if stock is available
          discount: 0,
          note: '',
        };
        setSaleItems(prevItems => [...prevItems, newSaleItem]);
    }
    setSearchTerm(''); 
    setSearchResults([]); 
    setShowSearchResults(false); 
    setSubmissionStatus(null); 
  };

  const updateSaleItem = (index: number, updatedItem: SaleItem) => {
    setSaleItems(prevItems => prevItems.map((item, i) => (i === index ? updatedItem : item)));
  };

  const removeSaleItem = (index: number) => {
    setSaleItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  const saleItemsWithFinalPrice: SaleItemWithFinalPrice[] = useMemo(() => {
    return saleItems.map(item => ({
      ...item,
      finalPrice: item.product.price * item.quantity - item.discount,
    }));
  }, [saleItems]);

  const totalAmount = useMemo(() => {
    return saleItemsWithFinalPrice.reduce((sum, item) => sum + item.finalPrice, 0);
  }, [saleItemsWithFinalPrice]);

  const handleSubmitSale = async () => {
    if (saleItems.length === 0) {
      setSubmissionStatus({ type: 'error', message: 'Cannot submit an empty sale. Please add products.' });
      return;
    }
    
    setIsLoadingSearch(true); 
    setSubmissionStatus(null); 
    
    try {
      const stockUpdatePromises = saleItems.map(item => 
        productService.updateStock(item.product.id, item.selectedSize, item.quantity)
      );
      await Promise.all(stockUpdatePromises);

      await productService.submitSaleToHistory(saleItems, totalAmount, paymentMethod);
      
      setSubmissionStatus({ type: 'success', message: 'Sale submitted successfully!' });
      setSaleItems([]);
      setSearchTerm('');
      setShowSearchResults(false);
      setSelectedCategoryId(ALL_CATEGORIES_ID);
      setPaymentMethod(PAYMENT_METHODS[0]);
      setTimeout(() => setSubmissionStatus(null), 5000);

    } catch (error) {
      console.error("Error submitting sale:", error);
      setSubmissionStatus({ type: 'error', message: 'Failed to submit sale. Please try again.' });
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const handleClearSale = () => {
    if (saleItems.length === 0 && searchTerm === '' && selectedCategoryId === ALL_CATEGORIES_ID) return; 

    const confirmClear = window.confirm("Are you sure you want to clear the current sale and search filters? This action cannot be undone.");
    if (confirmClear) {
      setSaleItems([]);
      setSearchTerm('');
      setSelectedCategoryId(ALL_CATEGORIES_ID);
      setPaymentMethod(PAYMENT_METHODS[0]);
      setSearchResults([]);
      setShowSearchResults(false);
      setSubmissionStatus(null);
    }
  };

  const categoryOptions = useMemo(() => {
    return [
      { value: ALL_CATEGORIES_ID, label: "All Categories" },
      ...categories.map(cat => ({ value: cat.id, label: cat.name }))
    ];
  }, [categories]);

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl space-y-6"> 
      {submissionStatus && (
        <div className={`p-4 rounded-md text-sm mb-4 ${submissionStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`} role="alert">
          {submissionStatus.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <Select
          label="Filter by Category"
          value={selectedCategoryId}
          onChange={(e) => {
            setSelectedCategoryId(e.target.value);
            setSubmissionStatus(null); 
          }}
          options={categoryOptions}
          containerClassName="md:col-span-1"
          aria-label="Filter products by category"
        />
        <div className="relative md:col-span-2">
          <Input
            label="Search Product (Name, Code, Manufacturer)"
            type="text"
            placeholder="Start typing to search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value.trim() === '') setShowSearchResults(false);
              setSubmissionStatus(null); 
            }}
            onFocus={() => searchTerm.trim() && searchResults.length > 0 && setShowSearchResults(true)}
            className="pr-10"
            aria-label="Search for products by name, code, or manufacturer"
          />
          <SearchIcon className="absolute right-3 top-9 h-5 w-5 text-gray-400 pointer-events-none" />
          {isLoadingSearch && !submissionStatus && <p className="text-xs text-gray-500 mt-1" aria-live="polite">Searching...</p>}
          {showSearchResults && (
            <div 
              className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto"
              onMouseLeave={() => setShowSearchResults(false)} // Hide on mouse leave
            >
              {searchResults.length > 0 ? (
                <ul>
                  {searchResults.map(product => (
                    <li
                      key={product.id}
                      className={`p-3 hover:bg-indigo-50 cursor-pointer text-sm flex items-center ${(product.totalStock ?? 0) === 0 ? 'text-gray-400 opacity-70 cursor-not-allowed' : 'text-gray-700'}`}
                      onClick={() => (product.totalStock ?? 0) > 0 && addProductToSale(product)}
                      onKeyDown={(e) => (product.totalStock ?? 0) > 0 && e.key === 'Enter' && addProductToSale(product)}
                      title={(product.totalStock ?? 0) === 0 ? `${product.title} - Out of stock` : `${product.title} by ${product.manufacturerName}`}
                      tabIndex={(product.totalStock ?? 0) > 0 ? 0 : -1}
                      role="option"
                      aria-selected="false" 
                      aria-disabled={(product.totalStock ?? 0) === 0}
                    >
                      <img 
                        src={product.image} 
                        alt={product.title} 
                        className="w-10 h-10 object-cover rounded-md mr-3 flex-shrink-0" 
                        onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/40?text=No+Img')}
                      />
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-medium">{product.title}</p>
                                <p className="text-xs text-gray-500">{product.code} - {product.manufacturerName || 'N/A'}</p>
                                <p className="text-xs text-gray-500">Category: {product.categoryName || 'N/A'} - Stock: {product.totalStock ?? 0}</p>
                            </div>
                            {(product.totalStock ?? 0) > 0 && <PlusIcon className="text-indigo-500 h-5 w-5 ml-2 flex-shrink-0"/> }
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                 searchTerm.trim().length > 1 && !isLoadingSearch && (
                   <p className="p-3 text-sm text-gray-500">No products found for "{searchTerm}".</p>
                 )
              )}
            </div>
          )}
        </div>
      </div>

      {saleItems.length > 0 && (
        <div className="mt-6 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300" aria-label="Current Sale Items">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Product Name</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Image</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Code</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Size</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quantity</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit Price</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Discount (€)</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Final Price</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Note</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-center text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {saleItems.map((item, index) => (
                      <SaleItemRow
                        key={item.id} 
                        item={item}
                        index={index}
                        onUpdateItem={updateSaleItem}
                        onRemoveItem={removeSaleItem}
                        // productStock prop removed from SaleItemRow, it's calculated internally
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {saleItems.length === 0 && (
        <p className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-md mt-6">
          No products added to the sale yet. Use the search above to add products.
        </p>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value as PaymentMethod);
              setSubmissionStatus(null); 
            }}
            options={PAYMENT_METHODS}
            containerClassName="w-full sm:w-auto sm:min-w-[200px]"
            aria-label="Select payment method"
          />
          <div className="text-right w-full sm:w-auto space-y-2">
            <p className="text-xl font-semibold text-gray-800" aria-live="polite">
              Total: <span className="text-indigo-600">€{totalAmount.toFixed(2)}</span>
            </p>
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button
                onClick={handleClearSale}
                disabled={saleItems.length === 0 && searchTerm === '' && selectedCategoryId === ALL_CATEGORIES_ID}
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
                aria-label="Clear all items from the current sale and reset filters"
              >
                Clear Sale & Filters
              </Button>
              <Button
                onClick={handleSubmitSale}
                disabled={saleItems.length === 0 || isLoadingSearch}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto"
                aria-label="Submit current sale"
              >
                {isLoadingSearch && submissionStatus === null ? 'Processing...' : 'Submit Sale'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
