import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CartItem } from '../models/cart-item';
import { CommandeService } from './commande.service';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { User } from '@angular/fire/auth';
import { OrderDto } from '../models/order-dto';
import { DatePipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // BehaviorSubject to manage cart visibility
  private readonly cartVisibility = new BehaviorSubject<boolean>(false);
  private cartDetails: CartItem[] = [];
  private readonly cartDetailsSubject = new BehaviorSubject<CartItem[]>(this.cartDetails);

  // Observable for components to subscribe to
  cartVisibility$ = this.cartVisibility.asObservable();
  cartDetails$ = this.cartDetailsSubject.asObservable();

  constructor(
    private readonly cs: CommandeService,
    private readonly as: AuthService,
    private readonly router: Router,
    private readonly dp: DatePipe
  ) {
    this.loadCart();
  }

  // Load cart from localStorage on initialization
  private loadCart() {
    const cartData = JSON.parse(localStorage.getItem('cartDetails') ?? '[]');
    this.cartDetails = cartData;
    this.cartDetailsSubject.next(this.cartDetails);
  }

  // Method to toggle cart visibility
  toggleCart() {
    this.cartVisibility.next(!this.cartVisibility.value);
  }

  addToCart(cartitem: CartItem) {
    const existingItem = this.cartDetails.find(cartItem => cartItem.product.id === cartitem.product.id);
    if (existingItem) {
      existingItem.qte += cartitem.qte;
    } else {
      this.cartDetails.push(cartitem);
    }
    this.cartDetailsSubject.next(this.cartDetails);
    localStorage.setItem('cartDetails', JSON.stringify(this.cartDetails));
  }

  removeItem(cartItem: CartItem) {
    // Find the item in the cart by its product ID
    const existingItem = this.cartDetails.find(item => item.product.id === cartItem.product.id);

    if (existingItem) {
      // If quantity is greater than 1, decrease it
      if (existingItem.qte > 1) {
        existingItem.qte -= 1;
      } else {
        // If quantity is 1, remove the item entirely
        const index = this.cartDetails.indexOf(existingItem);
        this.cartDetails.splice(index, 1);
      }
    }

    // Update the BehaviorSubject with the modified cart details
    this.cartDetailsSubject.next(this.cartDetails);

    // Sync with localStorage
    localStorage.setItem('cartDetails', JSON.stringify(this.cartDetails));
  }

  getTotal(): number {
    let total: number = 0;
    for (let item of this.cartDetails) { // Use 'for...of' to iterate over array items
      total += item.product.price * item.qte;
    }
    return total;
  }

  validerPanier() {
    // Check if the user is authenticated
    if (!this.as.getAuthState()) {
      console.log("User is not authenticated. Redirecting to login page.");
      this.router.navigate(['/login']); // Redirect to login if user is not authenticated
      return;
    }

    // Get the current authenticated user
    this.as.user$.subscribe((firebaseUser: User | null) => {
      if (firebaseUser) {
        // Get user ID and total amount
        const userId = firebaseUser.uid;
        const totalAmount = this.getTotal();

        // Convert CartItem instances to DetailOrderDTO instances
        const detailsDTO = this.cartDetails.map(item => new OrderDto(item.product.id, item.qte));

        // Save the Commande using CommandeService
        this.cs.addCommande(userId, totalAmount, detailsDTO);
        console.log("Commande validated and saved successfully.");

        // Clear the cart after validation
        this.cartDetails = [];
        this.cartDetailsSubject.next(this.cartDetails);
        localStorage.removeItem('cartDetails');
      }
    });
  }


}
