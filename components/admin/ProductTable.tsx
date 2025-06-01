import React from 'react';
import { Product } from '../../types';
import { Button } from '../common/Button';
import { PencilIcon } from '../icons/PencilIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { EyeIcon, EyeSlashIcon } from '../icons/VisibilityIcons';
import { DuplicateIcon } from '../icons/DuplicateIcon'; // New Icon

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onToggleVisibility: (product: Product) => void;
  onDuplicate: (product: Product) => void; // New Prop
}

export const ProductTable: React.FC<ProductTableProps> = ({ products, onEdit, onDelete, onToggleVisibility, onDuplicate }) => {
  if (products.length === 0) {
    return <p className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-md">No products found.</p>;
  }

  return (
    <div className="flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-300" aria-label="Products">
            <thead>
              <tr className="bg-gray-50">
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Image</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Title</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Code</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Category</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Manufacturer</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Price</th>
                <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold text-gray-900">Total Stock</th>
                <th scope="col" className="px-3 py-3.5 text-center text-xs font-semibold text-gray-900">Visible</th>
                <th scope="col" className="px-3 py-3.5 text-center text-xs font-semibold text-gray-900 min-w-[200px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="whitespace-nowrap px-3 py-4">
                    <img src={product.image} alt={product.title} className="w-10 h-10 object-cover rounded" />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 font-medium">{product.title}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.code}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.categoryName || product.categoryId}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.manufacturerName || product.manufacturerId}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">€{product.price.toFixed(2)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.totalStock ?? 0}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleVisibility(product)}
                        aria-label={product.isVisible ? "Mark as not visible" : "Mark as visible"}
                        title={product.isVisible ? "Visible (Click to hide)" : "Hidden (Click to show)"}
                        className="flex items-center justify-center mx-auto"
                    >
                        {product.isVisible ? <EyeIcon className="text-green-500 h-5 w-5" /> : <EyeSlashIcon className="text-gray-400 h-5 w-5" />}
                    </Button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(product)} aria-label="Edit product" className="group inline-flex items-center">
                      <PencilIcon className="text-indigo-600 group-hover:text-indigo-800 h-5 w-5" />
                      <span className="ml-1 text-xs text-indigo-600 group-hover:text-indigo-800">Edit</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDuplicate(product)} aria-label="Duplicate product" className="group inline-flex items-center">
                      <DuplicateIcon className="text-blue-500 group-hover:text-blue-700 h-5 w-5" />
                      <span className="ml-1 text-xs text-blue-500 group-hover:text-blue-700">Duplicate</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(product.id)} aria-label="Delete product" className="group inline-flex items-center">
                      <TrashIcon className="text-red-500 group-hover:text-red-700 h-5 w-5" />
                      <span className="ml-1 text-xs text-red-500 group-hover:text-red-700">Delete</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};