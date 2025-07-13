import { OrderDto } from "./order-dto";

// In src/app/models/commande.ts
export class Commande {
    id?: string;
    userId: string;
    montant: number;
    dateCommande: string;
    details: Array<OrderDto>;
  
    constructor(userId: string, montant: number, dateCommande: string, details: Array<OrderDto>) {
      this.userId = userId;
      this.montant = montant;
      this.dateCommande = dateCommande;
      this.details = details;
    }
  }
  