export interface Item {
  name?: string | null;
  price?: string | null;
  link?: string | null;
  pageDetails?: Product;
}

export interface Product {
  name: string | null;
  price: string | null;
  description: string | null;
  availableSizes: string[] | null | undefined;
  images: (string | null)[] | null;
}
