import React, { useState, useEffect, useCallback } from 'react';
import { Category } from '../../types';
import { productService } from '../../services/productService';
import { Button } from '../common/Button';
import { PlusIcon } from '../icons/PlusIcon';
import { CategoryTable } from './CategoryTable';
import { CategoryFormModal } from './CategoryFormModal';

export const CategoryManagementPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  }

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    clearMessages();
    try {
      const fetchedCategories = await productService.fetchCategories();
      setCategories(fetchedCategories);
    } catch (err) {
      setError('Failed to load categories.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenAddModal = () => {
    clearMessages();
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    clearMessages();
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = async (categoryData: Omit<Category, 'id'> | Category) => {
    clearMessages();
    try {
      if ('id' in categoryData && categoryData.id) { 
        const updatedCategory = await productService.updateCategoryAdmin(categoryData as Category);
        if (updatedCategory) {
          setCategories(prev => prev.map(c => c.id === updatedCategory.id ? updatedCategory : c));
          setSuccessMessage("Category updated successfully!");
        } else {
          throw new Error("Update operation returned undefined or failed.");
        }
      } else { 
        const newCategory = await productService.addCategoryAdmin(categoryData as Omit<Category, 'id'>);
        setCategories(prev => [...prev, newCategory]);
        setSuccessMessage("Category added successfully!");
      }
      handleCloseModal();
    } catch (err) {
      console.error("Error saving category:", err);
      setError(`Failed to save category: ${err instanceof Error ? err.message : "Unknown error"}.`);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    clearMessages();
    const categoryToDelete = categories.find(c => c.id === categoryId);
    if (window.confirm(`Are you sure you want to delete the category "${categoryToDelete?.name}"? This will reassign its products to "Uncategorized". This action cannot be undone.`)) {
      try {
        const result = await productService.deleteCategoryAdmin(categoryId);
        if (result.success) {
          setCategories(prev => prev.filter(c => c.id !== categoryId));
          setSuccessMessage(result.message || "Category deleted successfully!");
        } else {
          setError(result.message || "Failed to delete category from the server.");
        }
      } catch (err) {
        console.error("Error deleting category:", err);
        setError(`Failed to delete category: ${err instanceof Error ? err.message : "Unknown error"}.`);
      }
    }
  };

  if (isLoading) {
    return <p className="text-center text-gray-500 py-8">Loading categories...</p>;
  }

  const MessageDisplay = () => {
    if (error) return <p className="text-center text-red-500 py-4 bg-red-50 rounded-md my-4">{error}</p>;
    if (successMessage) return <p className="text-center text-green-500 py-4 bg-green-50 rounded-md my-4">{successMessage}</p>;
    return null;
  }

  return (
    <div className="space-y-6">
      <MessageDisplay />
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Category Management</h2>
        <Button onClick={handleOpenAddModal} variant="primary" leftIcon={<PlusIcon />}>
          Add New Category
        </Button>
      </div>

      <CategoryTable
        categories={categories}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteCategory}
      />

      {isModalOpen && (
        <CategoryFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveCategory}
          category={editingCategory}
          key={editingCategory ? editingCategory.id : 'new-category-modal'}
        />
      )}
    </div>
  );
};
