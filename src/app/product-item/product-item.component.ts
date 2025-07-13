import { Component,Input } from '@angular/core';
import { Product } from '../models/product';
import { CommonModule } from '@angular/common';
import { CartService } from '../services/cart.service';
import { CartItem } from '../models/cart-item';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-item',
  standalone: true,
  imports: [CommonModule,FormsModule,RouterLink],
  templateUrl: './product-item.component.html',
  styleUrl: './product-item.component.css'
})
export class ProductItemComponent {
  @Input() produit!: Product; 
  quantity:number=1;
  Available: boolean = false;
  constructor(private cs :CartService){}

  ngOnInit() {
    this.Available = this.produit.stock > 0;
  }

  addToPanier() {
    if (this.produit) {
      let ci: CartItem =new CartItem(this.produit,this.quantity);
      this.cs.addToCart(ci);
      alert(`${this.produit.title} added to cart!`); // Optional: Notify the user
    }
  }

  getColor(): string {
    return this.produit.stock> 0 ? 'green' : 'red';
  }

  getState(): boolean {
    return this.produit.stock> 0 ? false : true;
  }
  incrementQuantity() {
    this.quantity++;
  }

  decrementQuantity() {
    if (this.quantity > 1) { // Prevent going below 1
      this.quantity--;
    }
  }

}
