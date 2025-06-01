export interface SizeStock {
  size: string;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Manufacturer {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  title: string;
  price: number;
  image: string; // URL of the image
  code: string;
  sizes: SizeStock[]; // Array of objects, each with size name and stock quantity
  // stock: number; // Removed: Stock is now per size. Total stock can be calculated.
  categoryId: string;
  manufacturerId: string; 
  isVisible: boolean;
  // For convenience, services might populate these
  categoryName?: string;
  manufacturerName?: string;
  totalStock?: number; // Calculated total stock
}

// ProductFormData.sizes will be a JSON string like: '[{"size":"S", "stock":10}, {"size":"M", "stock":5}]'
// ProductFormData.stock is removed as stock is managed per size.
export type ProductFormData = Omit<Product, 'id' | 'sizes' | 'categoryName' | 'manufacturerName' | 'totalStock'> & {
  id?: string; 
  sizes: string; // JSON string of SizeStock[] e.g., '[{"size":"S", "stock":10}, {"size":"M", "stock":20}]'
  // stock field removed
  manufacturerId: string; // Ensuring manufacturerId is explicitly part of form data
};


export interface SaleItem {
  id: string; 
  product: Product; // This will store a snapshot of the product at the time of sale
  selectedSize: string; // Specific size selected for this sale item
  quantity: number;
  discount: number; 
  note: string;
}

export interface SaleItemWithFinalPrice extends SaleItem {
  finalPrice: number;
}

export type PaymentMethod = string;

// For Sales History
export interface SaleItemRecord {
  productId: string; // Original product ID
  title: string;
  code: string;
  image: string; // URL of the product image at time of sale
  selectedSize: string;
  quantity: number;
  unitPrice: number; // Price per unit at time of sale
  discount: number; // Discount for this item line
  finalPrice: number; // quantity * unitPrice - discount
}

export interface SubmittedSale {
  id: string;
  items: SaleItemRecord[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  submissionDate: string; // ISO string date
  notes?: string; // Optional overall note for the sale
}