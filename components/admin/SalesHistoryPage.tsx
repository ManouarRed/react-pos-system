import React, { useState, useEffect, useCallback } from 'react';
import { SubmittedSale, Product } from '../../types';
import { productService } from '../../services/productService';
import { SalesHistoryTable } from './SalesHistoryTable';
import { SaleEditModal } from './SaleEditModal';

export const SalesHistoryPage: React.FC = () => {
  const [sales, setSales] = useState<SubmittedSale[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingSale, setEditingSale] = useState<SubmittedSale | null>(null);
  
  // Required for SaleEditModal to check current stock of products
  const [allProducts, setAllProducts] = useState<Product[]>([]);


  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const loadSalesAndProducts = useCallback(async () => {
    setIsLoading(true);
    clearMessages();
    try {
      const [fetchedSales, fetchedProducts] = await Promise.all([
        productService.fetchSubmittedSales(),
        productService.fetchAllProductsAdmin() // Fetch all products for stock checks
      ]);
      setSales(fetchedSales);
      setAllProducts(fetchedProducts);
    } catch (err) {
      setError('Failed to load sales history or product data.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSalesAndProducts();
  }, [loadSalesAndProducts]);

  const handleOpenEditModal = (sale: SubmittedSale) => {
    clearMessages();
    setEditingSale(sale);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingSale(null);
  };

  const handleSaveSale = async (updatedSaleData: SubmittedSale) => {
    clearMessages();
    if (!editingSale) return;

    // Store original quantities before update for stock adjustment logic in Phase 2
    // const originalSaleItems = editingSale.items.reduce((acc, item) => {
    //   acc[`${item.productId}-${item.selectedSize}`] = item.quantity;
    //   return acc;
    // }, {} as Record<string, number>);


    try {
      const updatedSale = await productService.updateSubmittedSale(updatedSaleData);
      if (updatedSale) {
        // Phase 2: Implement stock adjustments here based on quantity changes
        // For each item in updatedSale.items:
        //   const key = `${item.productId}-${item.selectedSize}`;
        //   const originalQty = originalSaleItems[key] || 0;
        //   const newQty = item.quantity;
        //   if (newQty !== originalQty) {
        //     const quantityDifference = originalQty - newQty; // If new is less, diff is positive (add back to stock)
        //     await productService.adjustProductStockAdmin(item.productId, item.selectedSize, quantityDifference);
        //   }
        // console.log("Stock adjustment logic to be implemented in Phase 2");


        setSales(prevSales => prevSales.map(s => (s.id === updatedSale.id ? updatedSale : s)));
        setSuccessMessage(`Sale ${updatedSale.id} updated successfully!`);
        // Optionally reload all products if stock was adjusted to reflect changes in other admin views
        // await loadSalesAndProducts(); // Or just update products locally
      } else {
        throw new Error("Update operation returned undefined.");
      }
      handleCloseEditModal();
    } catch (err) {
      console.error("Error updating sale:", err);
      setError(`Failed to update sale: ${err instanceof Error ? err.message : "Unknown error"}.`);
    }
  };


  if (isLoading) {
    return <p className="text-center text-gray-500 py-8">Loading sales history...</p>;
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
        <h2 className="text-2xl font-semibold text-gray-800">Sales History</h2>
        {/* Add any controls like date filters here if needed */}
      </div>

      {sales.length === 0 && !isLoading && (
         <p className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-300 rounded-md">
           No sales have been submitted yet.
         </p>
      )}

      {sales.length > 0 && (
        <SalesHistoryTable
          sales={sales}
          onEdit={handleOpenEditModal}
        />
      )}

      {isEditModalOpen && editingSale && (
        <SaleEditModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveSale}
          sale={editingSale}
          allProducts={allProducts} // Pass all products for stock checking
          key={editingSale.id}
        />
      )}
    </div>
  );
};
