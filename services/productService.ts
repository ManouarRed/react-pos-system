import { MOCK_PRODUCTS, CATEGORIES_DATA, MANUFACTURERS_DATA, UNCATEGORIZED_ID, UNKNOWN_MANUFACTURER_ID, MOCK_SUBMITTED_SALES } from '../constants';
import { Product, ProductFormData, Category, Manufacturer, SubmittedSale, SaleItem, SaleItemRecord, PaymentMethod, SizeStock } from '../types';

// Simulate API call delay
const API_DELAY = 300;

let localMockProducts: Product[] = JSON.parse(JSON.stringify(MOCK_PRODUCTS));
let localMockCategories: Category[] = JSON.parse(JSON.stringify(CATEGORIES_DATA));
let localMockManufacturers: Manufacturer[] = JSON.parse(JSON.stringify(MANUFACTURERS_DATA));
let localMockSubmittedSales: SubmittedSale[] = JSON.parse(JSON.stringify(MOCK_SUBMITTED_SALES));


// Helper to get category name by ID
const getCategoryNameById = (categoryId: string): string | undefined => {
  const category = localMockCategories.find(c => c.id === categoryId);
  return category?.name;
};

// Helper to get manufacturer name by ID
const getManufacturerNameById = (manufacturerId: string): string | undefined => {
  const manufacturer = localMockManufacturers.find(m => m.id === manufacturerId);
  return manufacturer?.name;
};

// Helper to enrich product with categoryName, manufacturerName, and totalStock
const enrichProductWithNames = (product: Product): Product => {
  const totalStock = product.sizes.reduce((sum, sizeEntry) => sum + sizeEntry.stock, 0);
  return {
    ...product,
    categoryName: getCategoryNameById(product.categoryId) || getCategoryNameById(UNCATEGORIZED_ID),
    manufacturerName: getManufacturerNameById(product.manufacturerId) || getManufacturerNameById(UNKNOWN_MANUFACTURER_ID),
    totalStock: totalStock,
  };
};

// Helper to parse sizes JSON string from ProductFormData
const parseSizesFromString = (sizesString: string): SizeStock[] => {
  try {
    const parsedSizes = JSON.parse(sizesString);
    if (Array.isArray(parsedSizes) && parsedSizes.every(s => typeof s.size === 'string' && typeof s.stock === 'number' && s.stock >= 0)) {
      // Deduplicate sizes by name, taking the first occurrence
      const uniqueSizesMap = new Map<string, SizeStock>();
      for (const sizeEntry of parsedSizes) {
        if (sizeEntry.size.trim() !== "" && !uniqueSizesMap.has(sizeEntry.size.trim())) {
          uniqueSizesMap.set(sizeEntry.size.trim(), {size: sizeEntry.size.trim(), stock: Math.max(0, sizeEntry.stock)});
        }
      }
      return Array.from(uniqueSizesMap.values());
    }
    console.warn("Parsed sizes data is not in the expected format (Array of {size: string, stock: number}):", parsedSizes);
    return [];
  } catch (e) {
    console.warn("Could not parse sizes JSON string:", sizesString, e);
    return [];
  }
};


export const productService = {
  // --- Category Management ---
  fetchCategories: async (): Promise<Category[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(JSON.parse(JSON.stringify(localMockCategories.filter(c => c.id !== UNCATEGORIZED_ID))));
      }, API_DELAY / 3);
    });
  },

  addCategoryAdmin: async (categoryData: Omit<Category, 'id'>): Promise<Category> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newCategory: Category = {
          ...categoryData,
          id: `cat${Date.now()}`,
        };
        localMockCategories.push(newCategory);
        resolve(newCategory);
      }, API_DELAY);
    });
  },

  updateCategoryAdmin: async (categoryData: Category): Promise<Category | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const categoryIndex = localMockCategories.findIndex(c => c.id === categoryData.id);
        if (categoryIndex !== -1 && categoryData.id !== UNCATEGORIZED_ID) {
          localMockCategories[categoryIndex] = categoryData;
          // Update categoryName in products
          localMockProducts = localMockProducts.map(p =>
            p.categoryId === categoryData.id ? enrichProductWithNames({ ...p, categoryName: categoryData.name }) : p
          );
          resolve(categoryData);
        } else {
          resolve(undefined);
        }
      }, API_DELAY);
    });
  },

  deleteCategoryAdmin: async (categoryId: string): Promise<{ success: boolean, message?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (categoryId === UNCATEGORIZED_ID) {
          resolve({ success: false, message: "Cannot delete the default 'Uncategorized' category." });
          return;
        }
        // Force delete: Reassign products to 'Uncategorized'
        localMockProducts = localMockProducts.map(p => {
          if (p.categoryId === categoryId) {
            return enrichProductWithNames({
              ...p,
              categoryId: UNCATEGORIZED_ID,
              categoryName: getCategoryNameById(UNCATEGORIZED_ID),
            });
          }
          return p;
        });
        
        const initialLength = localMockCategories.length;
        localMockCategories = localMockCategories.filter(c => c.id !== categoryId);
        resolve({ success: localMockCategories.length < initialLength, message: "Category deleted. Associated products (if any) have been moved to 'Uncategorized'." });
      }, API_DELAY);
    });
  },

  // --- Manufacturer Management ---
  fetchManufacturers: async (): Promise<Manufacturer[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(JSON.parse(JSON.stringify(localMockManufacturers.filter(m => m.id !== UNKNOWN_MANUFACTURER_ID))));
      }, API_DELAY / 3);
    });
  },

  addManufacturerAdmin: async (manufacturerData: Omit<Manufacturer, 'id'>): Promise<Manufacturer> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newManufacturer: Manufacturer = {
          ...manufacturerData,
          id: `man${Date.now()}`,
        };
        localMockManufacturers.push(newManufacturer);
        resolve(newManufacturer);
      }, API_DELAY);
    });
  },

  updateManufacturerAdmin: async (manufacturerData: Manufacturer): Promise<Manufacturer | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const manufacturerIndex = localMockManufacturers.findIndex(m => m.id === manufacturerData.id);
        if (manufacturerIndex !== -1 && manufacturerData.id !== UNKNOWN_MANUFACTURER_ID) {
          localMockManufacturers[manufacturerIndex] = manufacturerData;
           localMockProducts = localMockProducts.map(p =>
            p.manufacturerId === manufacturerData.id ? enrichProductWithNames({ ...p, manufacturerName: manufacturerData.name }) : p
          );
          resolve(manufacturerData);
        } else {
          resolve(undefined);
        }
      }, API_DELAY);
    });
  },

  deleteManufacturerAdmin: async (manufacturerId: string): Promise<{ success: boolean, message?: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (manufacturerId === UNKNOWN_MANUFACTURER_ID) {
          resolve({ success: false, message: "Cannot delete the default 'Unknown Manufacturer'." });
          return;
        }
        // Force delete: Reassign products
        localMockProducts = localMockProducts.map(p => {
          if (p.manufacturerId === manufacturerId) {
            return enrichProductWithNames({
              ...p,
              manufacturerId: UNKNOWN_MANUFACTURER_ID,
              manufacturerName: getManufacturerNameById(UNKNOWN_MANUFACTURER_ID),
            });
          }
          return p;
        });

        const initialLength = localMockManufacturers.length;
        localMockManufacturers = localMockManufacturers.filter(m => m.id !== manufacturerId);
        resolve({ success: localMockManufacturers.length < initialLength, message: "Manufacturer deleted. Associated products (if any) have been set to 'Unknown Manufacturer'." });
      }, API_DELAY);
    });
  },

  // --- Product Management (POS View) ---
  fetchProducts: async (query?: string, categoryId?: string): Promise<Product[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let products = localMockProducts.map(enrichProductWithNames).filter(p => p.isVisible);


        if (categoryId && categoryId !== "All Categories") {
          products = products.filter(p => p.categoryId === categoryId);
        }

        if (query) {
          const lowerQuery = query.toLowerCase();
          products = products.filter(
            p =>
              p.title.toLowerCase().includes(lowerQuery) ||
              p.code.toLowerCase().includes(lowerQuery) ||
              (p.manufacturerName || '').toLowerCase().includes(lowerQuery)
          );
        }
        resolve(products.filter(p => (p.totalStock ?? 0) > 0)); // Only return products with any stock
      }, API_DELAY);
    });
  },

  fetchProductById: async (id: string): Promise<Product | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const product = localMockProducts.find(p => p.id === id && p.isVisible);
        resolve(product ? enrichProductWithNames(product) : undefined);
      }, API_DELAY);
    });
  },

  updateStock: async (productId: string, sizeSold: string, quantitySold: number): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const productIndex = localMockProducts.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
          const product = localMockProducts[productIndex];
          const sizeIndex = product.sizes.findIndex(s => s.size === sizeSold);
          if (sizeIndex !== -1) {
            product.sizes[sizeIndex].stock -= quantitySold;
            if (product.sizes[sizeIndex].stock < 0) {
              product.sizes[sizeIndex].stock = 0; // Prevent negative stock
            }
            localMockProducts[productIndex] = enrichProductWithNames(product); // Re-enrich to update totalStock
            resolve(true);
          } else {
            console.error(`Size ${sizeSold} not found for product ${productId} during stock update.`);
            resolve(false); // Size not found for the product
          }
        } else {
          resolve(false); // Product not found
        }
      }, API_DELAY / 2);
    });
  },

  // --- Admin Product Management ---
  fetchAllProductsAdmin: async (): Promise<Product[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(JSON.parse(JSON.stringify(localMockProducts)).map(enrichProductWithNames));
      }, API_DELAY / 3);
    });
  },

  addProductAdmin: async (productData: ProductFormData): Promise<Product> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const parsedSizes = parseSizesFromString(productData.sizes);
         if (parsedSizes.length === 0 && productData.sizes.trim() !== "" && productData.sizes.trim() !== "[]") {
           console.warn(`Could not parse sizes JSON: '${productData.sizes}'. Product might be added with no sizes/stock.`);
        }

        const newProductBase: Omit<Product, 'totalStock' | 'categoryName' | 'manufacturerName'> = {
          id: `prod${Date.now()}`,
          title: productData.title,
          price: Number(productData.price),
          image: productData.image,
          code: productData.code,
          sizes: parsedSizes,
          categoryId: productData.categoryId,
          manufacturerId: productData.manufacturerId,
          isVisible: productData.isVisible,
        };
        const newProduct = enrichProductWithNames(newProductBase as Product);
        localMockProducts.push(newProduct);
        resolve(newProduct);
      }, API_DELAY);
    });
  },

  updateProductAdmin: async (productData: ProductFormData): Promise<Product | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!productData.id) {
          resolve(undefined);
          return;
        }
        const productIndex = localMockProducts.findIndex(p => p.id === productData.id);
        if (productIndex !== -1) {
          const parsedSizes = parseSizesFromString(productData.sizes);
           if (parsedSizes.length === 0 && productData.sizes.trim() !== "" && productData.sizes.trim() !== "[]") {
             console.warn(`Could not parse sizes JSON for update: '${productData.sizes}'. Sizes may not be updated as expected or set to empty.`);
          }

          const updatedProductData = {
            title: productData.title,
            price: Number(productData.price),
            image: productData.image,
            code: productData.code,
            sizes: parsedSizes,
            categoryId: productData.categoryId,
            manufacturerId: productData.manufacturerId,
            isVisible: productData.isVisible,
          };
          localMockProducts[productIndex] = enrichProductWithNames({
             ...localMockProducts[productIndex], 
             ...updatedProductData,
             id: productData.id, 
          });
          resolve(localMockProducts[productIndex]);
        } else {
          resolve(undefined);
        }
      }, API_DELAY);
    });
  },

  deleteProductAdmin: async (productId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const initialLength = localMockProducts.length;
        localMockProducts = localMockProducts.filter(p => p.id !== productId);
        resolve(localMockProducts.length < initialLength);
      }, API_DELAY);
    });
  },

  toggleProductVisibilityAdmin: async (productId: string): Promise<Product | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const productIndex = localMockProducts.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
          localMockProducts[productIndex].isVisible = !localMockProducts[productIndex].isVisible;
          resolve(enrichProductWithNames(localMockProducts[productIndex]));
        } else {
          resolve(undefined);
        }
      }, API_DELAY);
    });
  },
  
  updateProductStockAdmin: async (productId: string, sizeName: string, newStock: number): Promise<Product | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const productIndex = localMockProducts.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
          const product = localMockProducts[productIndex];
          const sizeIndex = product.sizes.findIndex(s => s.size === sizeName);
          if (sizeIndex !== -1) {
            product.sizes[sizeIndex].stock = newStock >= 0 ? newStock : 0;
            localMockProducts[productIndex] = enrichProductWithNames(product);
            resolve(localMockProducts[productIndex]);
          } else {
            // Optionally, add the size if it doesn't exist, or return error/undefined
            // For now, let's assume size must exist.
            console.error(`Size "${sizeName}" not found for product ID "${productId}" in updateProductStockAdmin. Stock not updated.`);
            resolve(undefined); 
          }
        } else {
          console.error(`Product ID "${productId}" not found in updateProductStockAdmin. Stock not updated.`);
          resolve(undefined); 
        }
      }, API_DELAY / 2);
    });
  },

  duplicateProductAdmin: async (productId: string): Promise<Product | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const originalProduct = localMockProducts.find(p => p.id === productId);
        if (!originalProduct) {
          resolve(undefined);
          return;
        }
        const timestamp = Date.now();
        const uniqueSuffix = timestamp % 10000; 
        
        // Deep copy of sizes for the new product
        const duplicatedSizes = JSON.parse(JSON.stringify(originalProduct.sizes));

        const duplicatedProductBase: Omit<Product, 'totalStock' | 'categoryName' | 'manufacturerName'> = {
          ...originalProduct, 
          id: `prod${timestamp}`, 
          title: `${originalProduct.title} (Copy)`,
          code: `${originalProduct.code}-COPY${uniqueSuffix}`, 
          isVisible: false, 
          sizes: duplicatedSizes,
        };
        const duplicatedProduct = enrichProductWithNames(duplicatedProductBase as Product);
        localMockProducts.push(duplicatedProduct);
        resolve(duplicatedProduct);
      }, API_DELAY);
    });
  },

  // --- Sales History ---
  submitSaleToHistory: async (saleItems: SaleItem[], totalAmount: number, paymentMethod: PaymentMethod, saleNotes?: string): Promise<SubmittedSale> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const saleItemRecords: SaleItemRecord[] = saleItems.map(item => ({
          productId: item.product.id,
          title: item.product.title,
          code: item.product.code,
          image: item.product.image,
          selectedSize: item.selectedSize,
          quantity: item.quantity,
          unitPrice: item.product.price,
          discount: item.discount,
          finalPrice: (item.product.price * item.quantity) - item.discount,
        }));

        const newSale: SubmittedSale = {
          id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          items: saleItemRecords,
          totalAmount: totalAmount,
          paymentMethod: paymentMethod,
          submissionDate: new Date().toISOString(),
          notes: saleNotes,
        };
        localMockSubmittedSales.unshift(newSale);
        resolve(newSale);
      }, API_DELAY);
    });
  },

  fetchSubmittedSales: async (): Promise<SubmittedSale[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(JSON.parse(JSON.stringify(localMockSubmittedSales)));
      }, API_DELAY);
    });
  },

  updateSubmittedSale: async (updatedSaleData: SubmittedSale): Promise<SubmittedSale | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const saleIndex = localMockSubmittedSales.findIndex(s => s.id === updatedSaleData.id);
        if (saleIndex !== -1) {
          const newTotalAmount = updatedSaleData.items.reduce((sum, item) => sum + item.finalPrice, 0);
          const fullyUpdatedSale = { ...updatedSaleData, totalAmount: newTotalAmount };
          
          localMockSubmittedSales[saleIndex] = fullyUpdatedSale;
          resolve(fullyUpdatedSale);
        } else {
          resolve(undefined);
        }
      }, API_DELAY);
    });
  },

  adjustProductStockAdmin: async (productId: string, size: string, quantityChange: number): Promise<Product | undefined> => {
    // quantityChange: positive to add back to stock (sale quantity reduced/returned), negative to decrease stock (sale quantity increased/newly sold)
    return new Promise((resolve) => {
       setTimeout(() => {
        const productIndex = localMockProducts.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
          const product = localMockProducts[productIndex];
          const sizeIndex = product.sizes.findIndex(s => s.size === size);
          if (sizeIndex !== -1) {
            product.sizes[sizeIndex].stock += quantityChange; 
            if (product.sizes[sizeIndex].stock < 0) {
              console.warn(`Stock for ${product.title} size ${size} went negative after adjustment (${quantityChange}), setting to 0.`);
              product.sizes[sizeIndex].stock = 0;
            }
            localMockProducts[productIndex] = enrichProductWithNames(product);
            resolve(localMockProducts[productIndex]);
          } else {
            console.error(`adjustProductStockAdmin: Size ${size} not found for product ${productId}`);
            resolve(undefined);
          }
        } else {
          console.error(`adjustProductStockAdmin: Product ${productId} not found`);
          resolve(undefined);
        }
      }, API_DELAY / 2);
    });
  },
};