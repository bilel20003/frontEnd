import { Injectable } from '@angular/core';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  topologie: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private products: Product[] = [
    { id: 1, name: 'Produit A', description: 'Description du produit A', price: 100, stock: 50, topologie: '0-2 utilisateurs' },
    { id: 2, name: 'Produit B', description: 'Description du produit B', price: 200, stock: 30, topologie: '2-6 utilisateurs' },
    { id: 3, name: 'Produit C', description: 'Description du produit C', price: 150, stock: 10, topologie: '6-10 utilisateurs' },
    { id: 4, name: 'Produit D', description: 'Description du produit D', price: 50, stock: 100, topologie: 'Plus de 10 utilisateurs' }
  ];

  constructor() {}

  getProducts(): Product[] {
    return [...this.products]; // pour éviter la mutation directe
  }

  addProduct(product: Omit<Product, 'id'>): void {
    const newProduct: Product = {
      id: this.products.length > 0 ? this.products[this.products.length - 1].id + 1 : 1,
      ...product
    };
    this.products.push(newProduct);
  }

  updateProduct(id: number, updatedProduct: Partial<Product>): void {
    const index = this.products.findIndex(product => product.id === id);
    if (index !== -1) {
      this.products[index] = { ...this.products[index], ...updatedProduct };
    }
  }

  deleteProduct(id: number): void {
    this.products = this.products.filter(product => product.id !== id);
  }
}
