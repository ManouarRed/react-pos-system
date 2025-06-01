
import React, { useState, useEffect, useMemo } from 'react';
import { SubmittedSale, Product, Category, Manufacturer } from '../../types';
import { productService } from '../../services/productService';
import { PAYMENT_METHODS } from '../../constants';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { FilterIcon } from '../icons/FilterIcon';
import { CalendarIcon } from '../icons/CalendarIcon';

interface MetricCardProps {
  title: string;
  value: string | number;
  isCurrency?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, isCurrency }) => (
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200">
    <h3 className="text-sm sm:text-base font-medium text-gray-500 truncate">{title}</h3>
    <p className="mt-1 text-2xl sm:text-3xl font-semibold text-indigo-600">
      {isCurrency ? `€${Number(value).toFixed(2)}` : value}
    </p>
  </div>
);

interface AnalyticsData {
  totalRevenue: number;
  totalSalesCount: number;
  totalItemsSold: number;
  averageSaleValue: number;
  topProductsByQuantity: { id: string, title: string, code: string, quantity: number }[];
  topProductsByRevenue: { id: string, title: string, code: string, revenue: number }[];
  revenueByCategory: { categoryName: string, revenue: number }[];
  revenueByManufacturer: { manufacturerName: string, revenue: number }[];
  paymentMethodDistribution: { method: string, count: number, percentage: string }[];
  dailySales: { date: string, salesCount: number, totalRevenue: number }[];
}

const initialAnalyticsData: AnalyticsData = {
  totalRevenue: 0,
  totalSalesCount: 0,
  totalItemsSold: 0,
  averageSaleValue: 0,
  topProductsByQuantity: [],
  topProductsByRevenue: [],
  revenueByCategory: [],
  revenueByManufacturer: [],
  paymentMethodDistribution: [],
  dailySales: [],
};

export const SalesAnalyticsPage: React.FC = () => {
  const [sales, setSales] = useState<SubmittedSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [fetchedSales, fetchedProducts, fetchedCategories, fetchedManufacturers] = await Promise.all([
          productService.fetchSubmittedSales(),
          productService.fetchAllProductsAdmin(),
          productService.fetchCategories(),
          productService.fetchManufacturers(),
        ]);
        setSales(fetchedSales);
        setProducts(fetchedProducts);
        setCategories(fetchedCategories);
        setManufacturers(fetchedManufacturers);
      } catch (err) {
        console.error("Error loading analytics data:", err);
        setError("Failed to load data for analytics.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.submissionDate);
      if (filterDateFrom && saleDate < new Date(filterDateFrom)) {
        return false;
      }
      if (filterDateTo) {
        // Include sales up to the end of the filterDateTo day
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (saleDate > toDate) {
          return false;
        }
      }
      return true;
    });
  }, [sales, filterDateFrom, filterDateTo]);


  const analyticsData = useMemo((): AnalyticsData => {
    if (!filteredSales.length || !products.length) return initialAnalyticsData;

    const data: AnalyticsData = { ...initialAnalyticsData, topProductsByQuantity: [], topProductsByRevenue: [], revenueByCategory: [], revenueByManufacturer: [], paymentMethodDistribution: [], dailySales: [] };

    data.totalSalesCount = filteredSales.length;

    const productSaleDetails: Record<string, { quantity: number, revenue: number, productDetails?: Product }> = {};
    const categoryRevenue: Record<string, number> = {};
    const manufacturerRevenue: Record<string, number> = {};
    const paymentMethodsCount: Record<string, number> = {};
    const dailySalesMap: Record<string, { salesCount: number, totalRevenue: number }> = {};

    for (const sale of filteredSales) {
      data.totalRevenue += sale.totalAmount;
      data.totalItemsSold += sale.items.reduce((sum, item) => sum + item.quantity, 0);

      const saleDay = sale.submissionDate.split('T')[0];
      if (!dailySalesMap[saleDay]) {
        dailySalesMap[saleDay] = { salesCount: 0, totalRevenue: 0 };
      }
      dailySalesMap[saleDay].salesCount++;
      dailySalesMap[saleDay].totalRevenue += sale.totalAmount;

      paymentMethodsCount[sale.paymentMethod] = (paymentMethodsCount[sale.paymentMethod] || 0) + 1;

      for (const item of sale.items) {
        if (!productSaleDetails[item.productId]) {
          productSaleDetails[item.productId] = { quantity: 0, revenue: 0, productDetails: products.find(p => p.id === item.productId) };
        }
        productSaleDetails[item.productId].quantity += item.quantity;
        productSaleDetails[item.productId].revenue += item.finalPrice;

        const productDetail = productSaleDetails[item.productId].productDetails;
        if (productDetail) {
          categoryRevenue[productDetail.categoryId] = (categoryRevenue[productDetail.categoryId] || 0) + item.finalPrice;
          manufacturerRevenue[productDetail.manufacturerId] = (manufacturerRevenue[productDetail.manufacturerId] || 0) + item.finalPrice;
        }
      }
    }

    data.averageSaleValue = data.totalSalesCount > 0 ? data.totalRevenue / data.totalSalesCount : 0;

    data.topProductsByQuantity = Object.entries(productSaleDetails)
      .sort(([, a], [, b]) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(([id, details]) => ({
        id,
        title: details.productDetails?.title || 'Unknown Product',
        code: details.productDetails?.code || 'N/A',
        quantity: details.quantity
      }));

    data.topProductsByRevenue = Object.entries(productSaleDetails)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(([id, details]) => ({
        id,
        title: details.productDetails?.title || 'Unknown Product',
        code: details.productDetails?.code || 'N/A',
        revenue: details.revenue
      }));
    
    data.revenueByCategory = Object.entries(categoryRevenue)
      .map(([catId, revenue]) => ({
        categoryName: categories.find(c => c.id === catId)?.name || catId,
        revenue
      }))
      .sort((a,b) => b.revenue - a.revenue);

    data.revenueByManufacturer = Object.entries(manufacturerRevenue)
      .map(([manId, revenue]) => ({
        manufacturerName: manufacturers.find(m => m.id === manId)?.name || manId,
        revenue
      }))
      .sort((a,b) => b.revenue - a.revenue);
    
    data.paymentMethodDistribution = PAYMENT_METHODS.map(method => {
      const count = paymentMethodsCount[method] || 0;
      return {
        method,
        count,
        percentage: data.totalSalesCount > 0 ? ((count / data.totalSalesCount) * 100).toFixed(1) + '%' : '0.0%'
      };
    });

    data.dailySales = Object.entries(dailySalesMap)
      .map(([date, details]) => ({ date, ...details }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Newest first

    return data;
  }, [filteredSales, products, categories, manufacturers]);

  const handleClearFilters = () => {
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const renderTable = (title: string, data: any[], columns: { header: string, accessor: string, isCurrency?: boolean, isPercentage?: boolean }[]) => (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      {data.length === 0 ? <p className="text-sm text-gray-500">No data available for this period.</p> : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {columns.map(col => (
                  <th key={col.accessor} className="py-2 px-3 text-left font-medium text-gray-600">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {columns.map(col => (
                    <td key={col.accessor} className="py-2 px-3 text-gray-700">
                      {col.isCurrency ? `€${Number(row[col.accessor]).toFixed(2)}` : 
                       col.isPercentage ? row[col.accessor] :
                       row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return <p className="text-center text-gray-500 py-10">Loading analytics data...</p>;
  }
  if (error) {
    return <p className="text-center text-red-500 py-10 bg-red-50 rounded-md">{error}</p>;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800">Sales Analytics</h2>

      {/* Filters */}
      <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200 space-y-4 sm:space-y-0 sm:flex sm:items-end sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Input
            label="Date From"
            type="date"
            id="filterDateFrom"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            containerClassName="w-full sm:w-auto"
          />
          <Input
            label="Date To"
            type="date"
            id="filterDateTo"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            containerClassName="w-full sm:w-auto"
          />
        </div>
        <Button onClick={handleClearFilters} variant="secondary" size="md" className="w-full sm:w-auto mt-2 sm:mt-0">
          Clear Date Filters
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard title="Total Revenue" value={analyticsData.totalRevenue} isCurrency />
        <MetricCard title="Total Sales" value={analyticsData.totalSalesCount} />
        <MetricCard title="Total Items Sold" value={analyticsData.totalItemsSold} />
        <MetricCard title="Average Sale Value" value={analyticsData.averageSaleValue} isCurrency />
      </div>

      {/* Aggregated Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTable("Top 5 Products (by Quantity Sold)", analyticsData.topProductsByQuantity, [
          { header: "Product", accessor: "title" },
          { header: "Code", accessor: "code" },
          { header: "Quantity Sold", accessor: "quantity" },
        ])}
        {renderTable("Top 5 Products (by Revenue)", analyticsData.topProductsByRevenue, [
          { header: "Product", accessor: "title" },
          { header: "Code", accessor: "code" },
          { header: "Revenue", accessor: "revenue", isCurrency: true },
        ])}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {renderTable("Revenue by Category", analyticsData.revenueByCategory, [
          { header: "Category", accessor: "categoryName" },
          { header: "Revenue", accessor: "revenue", isCurrency: true },
        ])}
        {renderTable("Revenue by Manufacturer", analyticsData.revenueByManufacturer, [
          { header: "Manufacturer", accessor: "manufacturerName" },
          { header: "Revenue", accessor: "revenue", isCurrency: true },
        ])}
      </div>
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderTable("Payment Method Distribution", analyticsData.paymentMethodDistribution, [
          { header: "Method", accessor: "method" },
          { header: "Sales Count", accessor: "count" },
          { header: "Percentage", accessor: "percentage", isPercentage: true },
        ])}
         {renderTable("Daily Sales Summary", analyticsData.dailySales, [
            { header: "Date", accessor: "date" },
            { header: "Sales Count", accessor: "salesCount" },
            { header: "Total Revenue", accessor: "totalRevenue", isCurrency: true },
        ])}
      </div>
    </div>
  );
};
