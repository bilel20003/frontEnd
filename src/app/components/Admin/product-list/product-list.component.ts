import { Component, OnInit } from '@angular/core';
import { ProductService } from 'C:/Users/pc_asus/Documents/frontEnd/src/app/services/product.service';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
}

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {

  products: Product[] = [];  // Tableau explicite de produits

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.getProducts();  // Charger les produits
  }

  getProducts(): void {
    this.products = this.productService.getProducts(); // Récupérer les produits depuis le service
  }
}
