import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { ProductService } from './services/product.service';
import { CartService } from './services/cart.service';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { provideFirebaseApp, initializeApp } from "@angular/fire/app"; 
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { DatePipe } from '@angular/common';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCuzVw8DQihbmLvRgi_5VSrsNZ6yGs5pw",
  authDomain: "shopfer-19be5.firebaseapp.com",
  projectId: "shopfer-19be5",
  storageBucket: "shopfer-19be5.appspot.com",
  messagingSenderId: "606811884047",
  appId: "1:606811884047:web:33a572072271edc35fb17a"
};

// Application configuration
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    ProductService,
    CartService,
    provideHttpClient(),
    AuthService,
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(()=>getAuth()),
    provideFirestore(() => getFirestore()),
    DatePipe
  ]
};
