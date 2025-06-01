
import { Product, Category, PaymentMethod, Manufacturer, SubmittedSale, SizeStock } from './types';

export const UNCATEGORIZED_ID = 'cat_uncategorized';
export const UNKNOWN_MANUFACTURER_ID = 'man_unknown';

export const CATEGORIES_DATA: Category[] = [
  { id: 'cat1', name: 'Electronics' },
  { id: 'cat2', name: 'Clothing' },
  { id: 'cat3', name: 'Groceries' },
  { id: 'cat4', name: 'Books' },
  { id: 'cat5', name: 'Home Goods' },
  { id: 'cat6', name: 'Toys' },
  { id: 'cat7', name: 'Sports' },
  { id: UNCATEGORIZED_ID, name: 'Uncategorized'},
];

export const MANUFACTURERS_DATA: Manufacturer[] = [
  { id: 'man1', name: 'LogiTech' },
  { id: 'man2', name: 'FashionCo' },
  { id: 'man3', name: 'FreshFarms' },
  { id: 'man4', name: 'PubHouse' },
  { id: 'man5', name: 'LightUp' },
  { id: 'man6', name: 'PlayFun' },
  { id: 'man7', name: 'SoundWave' },
  { id: 'man8', name: 'FitGear' },
  { id: 'man9', name: 'TechGiant Inc.' },
  { id: 'man10', name: 'HomeEssentials Ltd.'},
  { id: UNKNOWN_MANUFACTURER_ID, name: 'Unknown Manufacturer'},
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Mobile Payment',
  'Bank Transfer',
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod1',
    title: 'Wireless Mouse',
    price: 25.99,
    image: 'https://picsum.photos/seed/mouse/100/100',
    code: 'WM001',
    sizes: [{ size: 'One Size', stock: 50 }], // Updated to SizeStock[]
    // stock: 50, // Removed
    categoryId: 'cat1', 
    manufacturerId: 'man1', 
    isVisible: true,
  },
  {
    id: 'prod2',
    title: 'Cotton T-Shirt',
    price: 19.99,
    image: 'https://picsum.photos/seed/tshirt/100/100',
    code: 'CT002',
    sizes: [ // Updated to SizeStock[]
        { size: 'S', stock: 30 },
        { size: 'M', stock: 40 },
        { size: 'L', stock: 30 },
        { size: 'XL', stock: 20 },
    ],
    // stock: 120, // Removed
    categoryId: 'cat2', 
    manufacturerId: 'man2', 
    isVisible: true,
  },
  {
    id: 'prod3',
    title: 'Organic Apples (1kg)',
    price: 4.50,
    image: 'https://picsum.photos/seed/apples/100/100',
    code: 'GA003',
    sizes: [{ size: '1kg Bag', stock: 200 }], // Updated
    // stock: 200, // Removed
    categoryId: 'cat3', 
    manufacturerId: 'man3', 
    isVisible: true,
  },
  {
    id: 'prod4',
    title: 'Sci-Fi Novel: "Galaxy"',
    price: 12.75,
    image: 'https://picsum.photos/seed/book/100/100',
    code: 'BK004',
    sizes: [{ size: 'Hardcover', stock: 30 }], // Updated
    // stock: 30, // Removed
    categoryId: 'cat4', 
    manufacturerId: 'man4', 
    isVisible: true,
  },
  {
    id: 'prod5',
    title: 'LED Desk Lamp',
    price: 35.00,
    image: 'https://picsum.photos/seed/lamp/100/100',
    code: 'HL005',
    sizes: [{ size: 'Standard', stock: 45 }], // Updated
    // stock: 45, // Removed
    categoryId: 'cat5', 
    manufacturerId: 'man5', 
    isVisible: true,
  },
  {
    id: 'prod6',
    title: 'Building Blocks Set',
    price: 29.99,
    image: 'https://picsum.photos/seed/blocks/100/100',
    code: 'TY006',
    sizes: [{ size: '500 Pieces', stock: 0 }], // Updated, example of out of stock
    // stock: 0, // Removed
    categoryId: 'cat6', 
    manufacturerId: 'man6', 
    isVisible: true,
  },
  {
    id: 'prod7',
    title: 'Bluetooth Headphones',
    price: 79.99,
    image: 'https://picsum.photos/seed/headphones/100/100',
    code: 'EH007',
    sizes: [{ size: 'One Size', stock: 60 }], // Updated
    // stock: 60, // Removed
    categoryId: 'cat1', 
    manufacturerId: 'man7', 
    isVisible: true,
  },
  {
    id: 'prod8',
    title: 'Running Shoes',
    price: 99.50,
    image: 'https://picsum.photos/seed/shoes/100/100',
    code: 'RS008',
    sizes: [ // Updated
        { size: '8', stock: 15 },
        { size: '9', stock: 25 },
        { size: '10', stock: 20 },
        { size: '11', stock: 10 },
    ],
    // stock: 70, // Removed
    categoryId: 'cat2', 
    manufacturerId: 'man8', 
    isVisible: false, 
  },
];

export const MOCK_SUBMITTED_SALES: SubmittedSale[] = [];
