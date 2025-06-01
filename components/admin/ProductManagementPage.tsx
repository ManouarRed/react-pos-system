
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Product, ProductFormData, Category, Manufacturer, SizeStock } from '../../types';
import { productService } from '../../services/productService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { ProductTable } from './ProductTable';
import { PlusIcon } from '../icons/PlusIcon';
import { UploadIcon } from '../icons/UploadIcon'; 
import { DownloadIcon } from '../icons/DownloadIcon'; 
import { ProductFormModal } from './ProductFormModal';
import { FilterIcon } from '../icons/FilterIcon';
import { SortAscIcon } from '../icons/SortAscIcon';
import { SortDescIcon } from '../icons/SortDescIcon';

const ALL_FILTER_VALUE = "ALL";

export const ProductManagementPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState(ALL_FILTER_VALUE);
  const [filterManufacturerId, setFilterManufacturerId] = useState(ALL_FILTER_VALUE);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product | 'totalStock'; direction: 'ascending' | 'descending' } | null>(null);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const adminProducts = await productService.fetchAllProductsAdmin();
      setProducts(adminProducts);
    } catch (err) {
      setError('Failed to load products. Please check the console for more details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFilterData = useCallback(async () => {
    try {
      const [fetchedCategories, fetchedManufacturers] = await Promise.all([
        productService.fetchCategories(),
        productService.fetchManufacturers()
      ]);
      setCategories(fetchedCategories);
      setManufacturers(fetchedManufacturers);
    } catch (err) {
      console.error("Failed to load categories or manufacturers for filtering:", err);
      setError(prevError => prevError ? `${prevError} Could not load filter options.` : "Could not load filter options.");
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadFilterData();
  }, [loadProducts, loadFilterData]);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  }

  const handleOpenAddModal = () => {
    clearMessages();
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    clearMessages();
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async (formData: ProductFormData) => {
    clearMessages();
    try {
      if (editingProduct && formData.id) {
        const updatedProduct = await productService.updateProductAdmin(formData as Required<ProductFormData>); 
        if (updatedProduct) {
          setSuccessMessage("Product updated successfully!");
           await loadProducts(); // Reload all products to reflect update
        } else {
          throw new Error("Update operation returned undefined.");
        }
      } else { 
        const newProduct = await productService.addProductAdmin(formData);
        setSuccessMessage("Product added successfully!");
        await loadProducts(); // Reload to include new product
      }
      handleCloseModal();
    } catch (err) {
      console.error("Error saving product:", err);
      setError(`Failed to save product: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    clearMessages();
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      try {
        const success = await productService.deleteProductAdmin(productId);
        if (success) {
          setSuccessMessage("Product deleted successfully!");
          await loadProducts(); // Reload products
        } else {
          setError("Failed to delete product. The product might not exist or an error occurred on the server.");
        }
      } catch (err) {
        console.error("Error deleting product:", err);
        setError(`Failed to delete product: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`);
      }
    }
  };

  const handleToggleVisibility = async (product: Product) => {
    clearMessages();
    try {
      const updatedProduct = await productService.toggleProductVisibilityAdmin(product.id);
      if (updatedProduct) {
        setSuccessMessage(`Product visibility updated for "${updatedProduct.title}".`);
        await loadProducts(); // Reload products
      } else {
        throw new Error("Toggle visibility operation returned undefined.");
      }
    } catch (err) {
      console.error("Error toggling visibility:", err);
      setError(`Failed to update product visibility: ${err instanceof Error ? err.message : "Unknown error"}.`);
    }
  };

  const handleDuplicateProduct = async (productToDuplicate: Product) => {
    clearMessages();
    if (window.confirm(`Are you sure you want to duplicate "${productToDuplicate.title}"? A copy will be created and set to not visible.`)) {
      try {
        const duplicatedProduct = await productService.duplicateProductAdmin(productToDuplicate.id);
        if (duplicatedProduct) {
          setSuccessMessage(`Product "${productToDuplicate.title}" duplicated successfully as "${duplicatedProduct.title}". It's initially hidden.`);
          await loadProducts(); // Reload products
        } else {
          throw new Error("Duplicate operation returned undefined.");
        }
      } catch (err) {
        console.error("Error duplicating product:", err);
        setError(`Failed to duplicate product: ${err instanceof Error ? err.message : "Unknown error"}. Please try again.`);
      }
    }
  };

  const handleExportProducts = async () => {
    clearMessages();
    setIsLoading(true);
    try {
      const productsToExport = filteredAndSortedProducts; // Export the currently filtered/sorted list
      if(productsToExport.length === 0) {
        setError("No products to export based on current filters.");
        setIsLoading(false);
        return;
      }
      const worksheetData = productsToExport.map(p => ({
        ID: p.id,
        Title: p.title,
        Code: p.code,
        Category: p.categoryName || p.categoryId,
        Manufacturer: p.manufacturerName || p.manufacturerId,
        Price: p.price,
        TotalStock: p.totalStock ?? 0,
        SizesStockJSON: JSON.stringify(p.sizes),
        'Image URL': p.image,
        'Is Visible': p.isVisible ? 'Yes' : 'No',
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
      XLSX.writeFile(workbook, `ProductsExport_${new Date().toISOString().slice(0,10)}.xlsx`);
      setSuccessMessage("Products exported successfully!");
    } catch (err) {
      console.error("Error exporting products:", err);
      setError(`Failed to export products: ${err instanceof Error ? err.message : "Unknown error"}.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportProductsClick = () => {
    clearMessages();
    fileInputRef.current?.click();
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // ... (existing import logic - remains largely the same but will reload all products at the end)
    clearMessages();
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("File data could not be read.");
        
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
          setError("The imported file is empty or not formatted correctly.");
          setIsLoading(false);
          if(fileInputRef.current) fileInputRef.current.value = ""; 
          return;
        }
        
        const currentCategories = await productService.fetchCategories();
        const currentManufacturers = await productService.fetchManufacturers();
        const existingSystemProducts = await productService.fetchAllProductsAdmin(); 

        const categoryMap = new Map(currentCategories.map(c => [c.name.toLowerCase(), c.id]));
        const manufacturerMap = new Map(currentManufacturers.map(m => [m.name.toLowerCase(), m.id]));
        const productCodeMap = new Map(existingSystemProducts.map(p => [p.code.toLowerCase(), p]));

        let importedCount = 0;
        let updatedCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const rowIndex = i + 2; 

          if (!row.Title || !row.Code || row.Price == null || !row.Category || !row.Manufacturer || !row['Image URL']) {
            errors.push(`Row ${rowIndex}: Missing required fields (Title, Code, Price, Category, Manufacturer, Image URL). Stock/Sizes fields are also important.`);
            continue;
          }

          const categoryId = categoryMap.get(String(row.Category).toLowerCase());
          if (!categoryId) {
            errors.push(`Row ${rowIndex}: Category "${row.Category}" not found.`);
            continue;
          }
          const manufacturerId = manufacturerMap.get(String(row.Manufacturer).toLowerCase());
          if (!manufacturerId) {
            errors.push(`Row ${rowIndex}: Manufacturer "${row.Manufacturer}" not found.`);
            continue;
          }

          const price = parseFloat(row.Price);
          if (isNaN(price) || price <= 0) {
            errors.push(`Row ${rowIndex}: Invalid Price "${row.Price}". Must be a positive number.`);
            continue;
          }
          
          let sizesString = row.SizesStockJSON ? String(row.SizesStockJSON).trim() : '';
          const totalStockFromRow = row.TotalStock !== undefined ? parseInt(String(row.TotalStock), 10) : (row.Stock !== undefined ? parseInt(String(row.Stock), 10) : undefined);


          if (!sizesString && totalStockFromRow !== undefined && !isNaN(totalStockFromRow) && totalStockFromRow >= 0) {
            sizesString = JSON.stringify([{ size: 'One Size', stock: totalStockFromRow }]);
          } else if (!sizesString) {
            sizesString = '[]'; 
            errors.push(`Row ${rowIndex}: Missing 'SizesStockJSON' or valid 'TotalStock'/'Stock' field. Product will have no stock/sizes.`);
          }
          
          try {
            const parsed = JSON.parse(sizesString);
            if (!Array.isArray(parsed) || !parsed.every((s: any) => typeof s.size === 'string' && typeof s.stock === 'number' && s.stock >= 0)) {
              errors.push(`Row ${rowIndex}: 'SizesStockJSON' ("${sizesString}") is not a valid array of {size: string, stock: number (>=0)}.`);
              continue;
            }
          } catch (jsonError) {
            errors.push(`Row ${rowIndex}: 'SizesStockJSON' ("${sizesString}") is not valid JSON. ${jsonError}`);
            continue;
          }

          const productData: ProductFormData = {
            title: String(row.Title),
            code: String(row.Code),
            price: price,
            categoryId: categoryId,
            manufacturerId: manufacturerId,
            sizes: sizesString, 
            image: String(row['Image URL']),
            isVisible: row['Is Visible'] ? String(row['Is Visible']).toLowerCase() === 'yes' || String(row['Is Visible']).toLowerCase() === 'true' : true,
          };
          
          const existingProductByCode = productCodeMap.get(productData.code.toLowerCase());
          
          try {
            if (existingProductByCode) {
              await productService.updateProductAdmin({ ...productData, id: existingProductByCode.id });
              updatedCount++;
            } else {
              await productService.addProductAdmin(productData);
              importedCount++;
            }
          } catch (prodServiceError) {
             errors.push(`Row ${rowIndex} (Code: ${productData.code}): Error processing - ${prodServiceError instanceof Error ? prodServiceError.message : "Unknown service error"}`);
          }
        }

        await loadProducts(); 

        let summaryMessage = "";
        if (importedCount > 0) summaryMessage += `${importedCount} products imported. `;
        if (updatedCount > 0) summaryMessage += `${updatedCount} products updated. `;
        if (errors.length > 0) {
          setError(`Import completed with errors. ${summaryMessage} See details below:\n- ${errors.join('\n- ')}`);
        } else if (summaryMessage) {
          setSuccessMessage(`Import successful! ${summaryMessage}`);
        } else {
          setError("No products were imported or updated. Check file format or content.");
        }

      } catch (err) {
        console.error("Error importing products:", err);
        setError(`Failed to import products: ${err instanceof Error ? err.message : "Ensure the file is a valid XLSX format and data is correct."}`);
      } finally {
        setIsLoading(false);
        if(fileInputRef.current) fileInputRef.current.value = ""; 
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let processedProducts = [...products];

    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      processedProducts = processedProducts.filter(p =>
        p.title.toLowerCase().includes(lowerSearchTerm) ||
        p.code.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Filter by category
    if (filterCategoryId !== ALL_FILTER_VALUE) {
      processedProducts = processedProducts.filter(p => p.categoryId === filterCategoryId);
    }

    // Filter by manufacturer
    if (filterManufacturerId !== ALL_FILTER_VALUE) {
      processedProducts = processedProducts.filter(p => p.manufacturerId === filterManufacturerId);
    }
    
    // Apply sorting
    if (sortConfig !== null) {
      processedProducts.sort((a, b) => {
        let valA = a[sortConfig.key as keyof Product];
        let valB = b[sortConfig.key as keyof Product];

        if (sortConfig.key === 'totalStock') {
          valA = a.totalStock ?? 0;
          valB = b.totalStock ?? 0;
        }
        
        if (typeof valA === 'string' && typeof valB === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return processedProducts;
  }, [products, searchTerm, filterCategoryId, filterManufacturerId, sortConfig]);

  const requestSort = (key: keyof Product | 'totalStock') => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Product | 'totalStock') => {
    if (!sortConfig || sortConfig.key !== key) {
      return <SortAscIcon className="w-3 h-3 text-gray-400 opacity-50 group-hover:opacity-100" />;
    }
    return sortConfig.direction === 'ascending' ? <SortAscIcon className="w-4 h-4 text-indigo-600" /> : <SortDescIcon className="w-4 h-4 text-indigo-600" />;
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterCategoryId(ALL_FILTER_VALUE);
    setFilterManufacturerId(ALL_FILTER_VALUE);
    setSortConfig(null);
    clearMessages();
  };

  const categoryOptions = [{ value: ALL_FILTER_VALUE, label: 'All Categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))];
  const manufacturerOptions = [{ value: ALL_FILTER_VALUE, label: 'All Manufacturers' }, ...manufacturers.map(m => ({ value: m.id, label: m.name }))];


  if (isLoading && !products.length && !categories.length && !manufacturers.length) { 
    return <p className="text-center text-gray-500 py-8">Loading product management...</p>;
  }

  const MessageDisplay = () => {
    if (error) return <p className="text-center text-red-500 py-4 bg-red-50 rounded-md my-4 whitespace-pre-wrap">{error}</p>;
    if (successMessage) return <p className="text-center text-green-500 py-4 bg-green-50 rounded-md my-4">{successMessage}</p>;
    return null;
  }

  return (
    <div className="space-y-6">
      <MessageDisplay />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Product Management</h2>
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".xlsx, .xls" className="hidden" aria-hidden="true" />
          <Button onClick={handleImportProductsClick} variant="secondary" leftIcon={<UploadIcon />} disabled={isLoading}>{isLoading ? 'Processing...' : 'Import (XLSX)'}</Button>
          <Button onClick={handleExportProducts} variant="secondary" leftIcon={<DownloadIcon />} disabled={isLoading}>{isLoading ? 'Processing...' : 'Export (XLSX)'}</Button>
          <Button onClick={handleOpenAddModal} variant="primary" leftIcon={<PlusIcon />} disabled={isLoading}>Add New Product</Button>
        </div>
      </div>

      {/* Filters and Sort Section */}
      <div className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <Input
            label="Search (Title, Code)"
            id="productSearch"
            placeholder="Enter title or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="w-full"
          />
          <Select
            label="Filter by Category"
            id="categoryFilter"
            options={categoryOptions}
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            containerClassName="w-full"
          />
          <Select
            label="Filter by Manufacturer"
            id="manufacturerFilter"
            options={manufacturerOptions}
            value={filterManufacturerId}
            onChange={(e) => setFilterManufacturerId(e.target.value)}
            containerClassName="w-full"
          />
          <div className="flex flex-col space-y-1">
             <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <div className="flex flex-wrap gap-2">
              {(['title', 'price', 'totalStock'] as const).map(key => (
                <Button
                  key={key}
                  variant={sortConfig?.key === key ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => requestSort(key)}
                  rightIcon={getSortIcon(key)}
                  className="flex-grow capitalize"
                >
                  {key === 'totalStock' ? 'Stock' : key}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
            <Button onClick={handleClearFilters} variant="ghost" size="sm" disabled={!searchTerm && filterCategoryId === ALL_FILTER_VALUE && filterManufacturerId === ALL_FILTER_VALUE && !sortConfig}>
                Clear Filters & Sort
            </Button>
        </div>
      </div>
      
      {isLoading && products.length > 0 && <p className="text-center text-gray-500 py-4">Updating products list...</p>}
      
      <ProductTable
        products={filteredAndSortedProducts}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteProduct}
        onToggleVisibility={handleToggleVisibility}
        onDuplicate={handleDuplicateProduct}
      />

      {isModalOpen && (
        <ProductFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveProduct}
          product={editingProduct}
          key={editingProduct ? editingProduct.id : 'new-product-modal'} 
        />
      )}
    </div>
  );
};
