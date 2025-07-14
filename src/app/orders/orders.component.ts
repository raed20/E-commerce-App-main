import { Component, OnInit } from '@angular/core';
import { Commande } from '../models/commande';
import { CommandeService } from '../services/commande.service';
import { CommonModule, DatePipe } from '@angular/common';
import { ProductService } from '../services/product.service';
import { Product } from '../models/product';
import { AuthService } from '../services/auth.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'] // Fix typo from `styleUrl` to `styleUrls`
})
export class OrdersComponent implements OnInit {
  commandes: Commande[] = [];
  selectedCommande: Commande | null = null;
  productNameMap: Map<number, Promise<string>> = new Map();

  constructor(private commandeService: CommandeService, private ps: ProductService,private as:AuthService,private dp:DatePipe) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders() {
    this.as.user$.subscribe((firebaseUser: User | null) => {
      if (firebaseUser) {
        const userId = firebaseUser.uid;
        this.commandeService.getCommandesByUserId(userId).subscribe((data: Commande[]) => {
          // Format dateCommande for each Commande
          this.commandes = data.map(commande => ({
            ...commande,
            dateCommande: this.dp.transform(commande.dateCommande, 'yyyy-MM-dd') || ''  // Reformat date
          }));
        });
      }
    });
  }


  showDetails(commande: Commande) {
    this.selectedCommande = commande;
    this.loadProductNames();
  }

  closeDetails() {
    this.selectedCommande = null;
  }

  loadProductNames() {
    if (this.selectedCommande) {
      // Clear previous product names to avoid mix-up between different commandes
      this.productNameMap.clear();

      // Iterate over each item in selectedCommande and load product names 
      for (const item of this.selectedCommande.details) {
        const productId = item.productid;
        // Store each product name as a Promise in the map
        this.productNameMap.set(productId, this.fetchProductName(productId));
      }
    }
  }

  fetchProductName(productId: number): Promise<string> {
    return new Promise((resolve) => {
      this.ps.getProductById(productId).subscribe((product: Product) => {
        resolve(product.title);
      });
    });
  }
}
