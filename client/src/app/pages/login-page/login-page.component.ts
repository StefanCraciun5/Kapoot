import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/services/auth-service/auth.service';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { CookieService } from 'ngx-cookie-service';

@Component({
    selector: 'app-login-page',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent {
    inputPassword: string = '';
    isInvalidePW = false;
    private authService: AuthService;
    constructor(
        private router: Router,
        communicationService: CommunicationService,
        cookieService: CookieService,
    ) {
        this.authService = new AuthService(communicationService, cookieService);
    }
    async authenticate() {
        if (this.inputPassword === '') {
            return;
        }
        this.authService
            .login(this.inputPassword)
            .then(() => {
                this.router.navigate(['/admin']);
            })
            .catch(() => {
                this.isInvalidePW = true;
                this.inputPassword = '';
            });
    }
}
