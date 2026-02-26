export interface Package {
  id: string;
  packageCode: string;
  category: string;
  description: string;
  productimageUrl: string;
  packageRawCost: number;
  productCode: string;
  giftsCode: string[];
  wrappingCode: string;
  boxCode: string;
  profit?: number; // Optional: only present for owner role
  sellerComission: number;
  deliveryCharge: number;
  commission?: number; // Optional: present for seller/reseller roles
  createdAt: string;
  userId: string;
}
