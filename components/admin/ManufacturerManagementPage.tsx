import React, { useState, useEffect, useCallback } from 'react';
import { Manufacturer } from '../../types';
import { productService } from '../../services/productService';
import { Button } from '../common/Button';
import { PlusIcon } from '../icons/PlusIcon';
import { ManufacturerTable } from './ManufacturerTable';
import { ManufacturerFormModal } from './ManufacturerFormModal';

export const ManufacturerManagementPage: React.FC = () => {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  }

  const loadManufacturers = useCallback(async () => {
    setIsLoading(true);
    clearMessages();
    try {
      const fetchedManufacturers = await productService.fetchManufacturers();
      setManufacturers(fetchedManufacturers);
    } catch (err) {
      setError('Failed to load manufacturers.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadManufacturers();
  }, [loadManufacturers]);

  const handleOpenAddModal = () => {
    clearMessages();
    setEditingManufacturer(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (manufacturer: Manufacturer) => {
    clearMessages();
    setEditingManufacturer(manufacturer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingManufacturer(null);
  };

  const handleSaveManufacturer = async (manufacturerData: Omit<Manufacturer, 'id'> | Manufacturer) => {
    clearMessages();
    try {
      if ('id' in manufacturerData && manufacturerData.id) { 
        const updatedManufacturer = await productService.updateManufacturerAdmin(manufacturerData as Manufacturer);
        if (updatedManufacturer) {
          setManufacturers(prev => prev.map(m => m.id === updatedManufacturer.id ? updatedManufacturer : m));
          setSuccessMessage("Manufacturer updated successfully!");
        } else {
          throw new Error("Update operation returned undefined or failed.");
        }
      } else { 
        const newManufacturer = await productService.addManufacturerAdmin(manufacturerData as Omit<Manufacturer, 'id'>);
        setManufacturers(prev => [...prev, newManufacturer]);
        setSuccessMessage("Manufacturer added successfully!");
      }
      handleCloseModal();
    } catch (err) {
      console.error("Error saving manufacturer:", err);
      setError(`Failed to save manufacturer: ${err instanceof Error ? err.message : "Unknown error"}.`);
    }
  };

  const handleDeleteManufacturer = async (manufacturerId: string) => {
    clearMessages();
    const manufacturerToDelete = manufacturers.find(m => m.id === manufacturerId);
    if (window.confirm(`Are you sure you want to delete the manufacturer "${manufacturerToDelete?.name}"? This will reassign its products to "Unknown Manufacturer". This action cannot be undone.`)) {
      try {
        const result = await productService.deleteManufacturerAdmin(manufacturerId);
        if (result.success) {
          setManufacturers(prev => prev.filter(m => m.id !== manufacturerId));
          setSuccessMessage(result.message || "Manufacturer deleted successfully!");
        } else {
          setError(result.message || "Failed to delete manufacturer.");
        }
      } catch (err) {
        console.error("Error deleting manufacturer:", err);
        setError(`Failed to delete manufacturer: ${err instanceof Error ? err.message : "Unknown error"}.`);
      }
    }
  };

  if (isLoading) {
    return <p className="text-center text-gray-500 py-8">Loading manufacturers...</p>;
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
        <h2 className="text-2xl font-semibold text-gray-800">Manufacturer Management</h2>
        <Button onClick={handleOpenAddModal} variant="primary" leftIcon={<PlusIcon />}>
          Add New Manufacturer
        </Button>
      </div>

      <ManufacturerTable
        manufacturers={manufacturers}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteManufacturer}
      />

      {isModalOpen && (
        <ManufacturerFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveManufacturer}
          manufacturer={editingManufacturer}
          key={editingManufacturer ? editingManufacturer.id : 'new-manufacturer-modal'}
        />
      )}
    </div>
  );
};
