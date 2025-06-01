import React, { useState, useEffect } from 'react';
import { Product, ProductFormData, Category, Manufacturer, SizeStock } from '../../types';
import { productService } from '../../services/productService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Textarea } from '../common/Textarea'; // Assuming you might have a Textarea component or use Input as textarea

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: ProductFormData) => void;
  product: Product | null;
}

const initialFormDataBase: Omit<ProductFormData, 'categoryId' | 'manufacturerId'> = {
  title: '',
  code: '',
  price: 0,
  sizes: '[]', // Default to an empty JSON array string
  image: '',
  isVisible: true,
};

export const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, product }) => {
  const [formData, setFormData] = useState<ProductFormData>({ ...initialFormDataBase, categoryId: '', manufacturerId: '' });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [fetchedCategories, fetchedManufacturers] = await Promise.all([
          productService.fetchCategories(),
          productService.fetchManufacturers()
        ]);
        setCategories(fetchedCategories);
        setManufacturers(fetchedManufacturers);

        if (!product) { 
          setFormData(prev => ({
            ...prev,
            categoryId: fetchedCategories.length > 0 ? fetchedCategories[0].id : '',
            manufacturerId: fetchedManufacturers.length > 0 ? fetchedManufacturers[0].id : '',
            sizes: '[]' // Ensure sizes is initialized correctly for new products
          }));
        }
      } catch (error) {
        console.error("Failed to load categories or manufacturers for form:", error);
      }
    };
    if (isOpen) {
        loadDropdownData();
    }
  }, [isOpen, product]);

  useEffect(() => {
    if (isOpen) {
        if (product) {
            setFormData({
                id: product.id,
                title: product.title,
                code: product.code,
                categoryId: product.categoryId,
                manufacturerId: product.manufacturerId,
                price: product.price,
                sizes: JSON.stringify(product.sizes || []), // Serialize SizeStock[] to JSON string
                image: product.image,
                isVisible: product.isVisible,
            });
        } else {
            // For new product, set defaults if dropdowns are loaded
            setFormData({
                ...initialFormDataBase,
                categoryId: categories.length > 0 ? categories[0].id : '',
                manufacturerId: manufacturers.length > 0 ? manufacturers[0].id : '',
                sizes: '[]'
            });
        }
        setFormErrors({});
    }
  }, [product, isOpen, categories, manufacturers]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (formErrors[name as keyof ProductFormData]) {
        setFormErrors(prev => ({...prev, [name]: undefined}));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ProductFormData, string>> = {};
    if (!formData.title.trim()) errors.title = "Title is required.";
    if (!formData.code.trim()) errors.code = "Product code is required.";
    if (!formData.categoryId) errors.categoryId = "Category is required.";
    if (!formData.manufacturerId) errors.manufacturerId = "Manufacturer is required.";

    const priceValue = parseFloat(String(formData.price));
    if (isNaN(priceValue) || priceValue <= 0) errors.price = "Price must be a number greater than 0.";
    
    if (!formData.image.trim()) {
        errors.image = "Image URL is required."
    } else {
        try {
            new URL(formData.image);
        } catch (_) {
            errors.image = "Please enter a valid URL for the image.";
        }
    }

    try {
      const parsedSizes = JSON.parse(formData.sizes);
      if (!Array.isArray(parsedSizes) || !parsedSizes.every(s => typeof s.size === 'string' && typeof s.stock === 'number' && s.stock >= 0)) {
        errors.sizes = 'Sizes must be a valid JSON array of {size: string, stock: number (>=0)}. Example: [{"size":"S", "stock":10}]';
      }
    } catch (e) {
      errors.sizes = 'Sizes & Stock must be valid JSON. Example: [{"size":"S", "stock":10}]';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave({
        ...formData,
        price: parseFloat(String(formData.price)),
        // sizes is already a string
      });
    }
  };

  if (!isOpen) return null;

  const categoryOptions = categories.map(cat => ({ value: cat.id, label: cat.name }));
  const manufacturerOptions = manufacturers.map(man => ({ value: man.id, label: man.name }));

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 id="product-modal-title" className="text-xl font-semibold text-gray-800">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Product Title"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={formErrors.title}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Product Code"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              error={formErrors.code}
              required
            />
            <Select
              label="Category"
              id="categoryId"
              name="categoryId"
              value={formData.categoryId}
              onChange={handleChange}
              options={categoryOptions}
              error={formErrors.categoryId}
              disabled={categories.length === 0}
              required
            />
          </div>
           <Select
              label="Manufacturer"
              id="manufacturerId"
              name="manufacturerId"
              value={formData.manufacturerId}
              onChange={handleChange}
              options={manufacturerOptions}
              error={formErrors.manufacturerId}
              disabled={manufacturers.length === 0}
              required
            />
          
          <Input
            label="Price (€)"
            id="price"
            name="price"
            type="number"
            value={formData.price}
            onChange={handleChange}
            min="0.01"
            step="0.01"
            error={formErrors.price}
            required
          />
          
          <div>
            <label htmlFor="sizes" className="block text-sm font-medium text-gray-700 mb-1">
              Sizes & Stock (JSON Format)
            </label>
            <textarea
              id="sizes"
              name="sizes"
              rows={4}
              value={formData.sizes}
              onChange={handleChange}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${formErrors.sizes ? 'border-red-500' : 'border-gray-300'}`}
              placeholder='e.g., [{"size":"S", "stock":10}, {"size":"M", "stock":20}]'
            />
            {formErrors.sizes && <p className="mt-1 text-xs text-red-600">{formErrors.sizes}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Enter as a JSON array. Each item must have a "size" (string) and "stock" (number &gt;= 0).
            </p>
          </div>

          <Input
            label="Image URL"
            id="image"
            name="image"
            type="url"
            value={formData.image}
            onChange={handleChange}
            error={formErrors.image}
            placeholder="https://example.com/image.jpg"
            required
          />
          <div className="flex items-center">
            <input
              id="isVisible"
              name="isVisible"
              type="checkbox"
              checked={formData.isVisible}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="isVisible" className="ml-2 block text-sm text-gray-900">
              Product is visible to customers
            </label>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {product ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};