import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  // Liste des produits par défaut
  private products = [
    { id: 1, name: 'Produit A', description: 'Description du produit A', price: 100, stock: 50 },
    { id: 2, name: 'Produit B', description: 'Description du produit B', price: 200, stock: 30 },
    { id: 3, name: 'Produit C', description: 'Description du produit C', price: 150, stock: 10 },
    { id: 4, name: 'Produit D', description: 'Description du produit D', price: 50, stock: 100 },
  ];

  constructor() { }

  // Méthode pour obtenir tous les produits
  getProducts() {
    return this.products;
  }

  // Méthode pour ajouter un produit
  addProduct(product: { name: string, description: string, price: number, stock: number }) {
    const newProduct = {
      id: this.products.length + 1, // Incrémenter l'id
      ...product // Spread operator pour ajouter les propriétés du produit
    };
    this.products.push(newProduct); // Ajouter le nouveau produit à la liste
  }

  // Méthode pour obtenir un produit par son ID
  getProductById(id: number) {
    return this.products.find(product => product.id === id);
  }

  // Méthode pour modifier un produit
  updateProduct(id: number, updatedProduct: { name: string, description: string, price: number, stock: number }) {
    const productIndex = this.products.findIndex(product => product.id === id);
    if (productIndex !== -1) {
      this.products[productIndex] = { ...this.products[productIndex], ...updatedProduct };
    }
  }

  // Méthode pour supprimer un produit
  deleteProduct(id: number) {
    this.products = this.products.filter(product => product.id !== id);
  }
}
