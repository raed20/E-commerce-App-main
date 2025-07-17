import { HttpEvent, HttpInterceptor, HttpRequest, HttpHandler } from "@angular/common/http";
import { Router } from "@angular/router";
import { AuthService } from "./services/auth.service";
import { Observable } from "rxjs";

export class AuthInterceptor implements HttpInterceptor {
    constructor(private readonly r: Router, private readonly as: AuthService) {}
    
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const isAuth = this.as.getAuthState();
        if (isAuth) {
            const token = this.as.getToken();
            
            // Proper token validation and handling
            if (token && typeof token === 'string') {
                const authReq = req.clone({
                    headers: req.headers.set('Authorization', `Bearer ${token}`)
                });
                return next.handle(authReq);
            }
            
            // Handle case where token is invalid or not a string
            console.warn('Invalid token received from AuthService');
            // Optionally redirect to login or handle the error appropriately
            // this.r.navigate(['/login']);
        }
        
        return next.handle(req);
    }
}