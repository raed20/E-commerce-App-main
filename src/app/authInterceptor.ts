import { HttpEvent, HttpInterceptor, HttpRequest, HttpHandler } from "@angular/common/http";
import { Router } from "@angular/router";
import { AuthService } from "./services/auth.service";
import { Observable } from "rxjs";

export class AuthInterceptor implements HttpInterceptor {
    constructor(
        private readonly r: Router,
        private readonly as: AuthService
    ) {}
    
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const isAuth = this.as.getAuthState();
        if (isAuth) {
            const authReq = req.clone({
                headers: req.headers.set('Authorization', 'Bearer ' + this.as.getToken())
            });
            return next.handle(authReq);
        }
        return next.handle(req);
    }
}