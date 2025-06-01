import React, { useState } from 'react';
import { ProductManagementPage } from './ProductManagementPage';
import { CategoryManagementPage } from './CategoryManagementPage';
import { ManufacturerManagementPage } from './ManufacturerManagementPage';
import { InventoryOverviewPage } from './InventoryOverviewPage';
import { SalesAnalyticsPage } from './SalesAnalyticsPage';
import { SalesHistoryPage } from './SalesHistoryPage'; // New
import { Button } from '../common/Button';

type AdminTab = 'products' | 'categories' | 'manufacturers' | 'inventory' | 'analytics' | 'salesHistory'; // Added salesHistory

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('products');

  const renderTabButton = (tabName: AdminTab, label: string) => (
    <Button
      variant="ghost"
      onClick={() => setActiveTab(tabName)}
      className={`whitespace-nowrap py-3 px-1 md:px-3 border-b-2 font-medium text-sm ${
        activeTab === tabName
          ? 'border-indigo-500 text-indigo-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
      aria-current={activeTab === tabName ? 'page' : undefined}
    >
      {label}
    </Button>
  );

  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow-2xl space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap space-x-2 sm:space-x-4 md:space-x-6" aria-label="Tabs">
          {renderTabButton('products', 'Products')}
          {renderTabButton('categories', 'Categories')}
          {renderTabButton('manufacturers', 'Manufacturers')}
          {renderTabButton('inventory', 'Inventory')}
          {renderTabButton('salesHistory', 'Sales History')}
          {renderTabButton('analytics', 'Analytics')}
        </nav>
      </div>

      {activeTab === 'products' && <ProductManagementPage />}
      {activeTab === 'categories' && <CategoryManagementPage />}
      {activeTab === 'manufacturers' && <ManufacturerManagementPage />}
      {activeTab === 'inventory' && <InventoryOverviewPage />}
      {activeTab === 'salesHistory' && <SalesHistoryPage />}
      {activeTab === 'analytics' && <SalesAnalyticsPage />}
    </div>
  );
};
