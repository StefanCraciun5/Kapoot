import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@app/services/auth-service/auth.service';

@Component({
    selector: 'app-admin-page',
    templateUrl: './admin-page.component.html',
    styleUrls: ['./admin-page.component.scss'],
})
export class AdminPageComponent implements OnInit {
    constructor(
        private readonly router: Router,
        private readonly authGuard: AuthService,
    ) {}
    async ngOnInit(): Promise<void> {
        const isLoggedIn = await this.authGuard.isLoggedIn();
        if (!isLoggedIn) {
            this.router.navigate(['/login']);
            return;
        }
    }
}
