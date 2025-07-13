import { Routes } from '@angular/router';
import { ListProductComponent } from './list-product/list-product.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { OrdersComponent } from './orders/orders.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { AuthGuard } from './guards/auth.guard';
import { SignUpComponent } from './sign-up/sign-up.component';

export const routes: Routes = [
    {
        path:'',redirectTo:'home',pathMatch:'full'
    },
    {
        path:'home', component : ListProductComponent
    },
    {
        path:'product/detail/:id',component:ProductDetailComponent
    },
    {
        path:'orders',component:OrdersComponent,canActivate:[AuthGuard]
    },
    {
        path:'login',component:SignInComponent
    },
    {
        path:'sign-up',component:SignUpComponent
    }

];
