export const calculateAvailableStock = (
  stockQuantity: number,
  reservedStock: number
): number => stockQuantity - reservedStock;

export const calculateSubtotal = (
  unitPrice: number,
  quantity: number
): number => unitPrice * quantity;