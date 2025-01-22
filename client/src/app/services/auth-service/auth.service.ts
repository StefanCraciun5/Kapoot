import { Injectable } from '@angular/core';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { Message } from '@common/message';
import { CookieService } from 'ngx-cookie-service';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    constructor(
        private readonly communicationService: CommunicationService,
        private readonly cookieManager: CookieService,
    ) {}
    async isLoggedIn(): Promise<boolean> {
        const path = 'admin/ping';
        return this.getServerMSG(path);
    }
    async login(password: string): Promise<boolean> {
        const message: Message = {
            title: 'Login request',
            body: password,
        };
        const path = 'admin/login';
        const promise = await this.postServerAndGetResponse(message, path);
        this.cookieManager.set('kapoot', JSON.parse(promise).cookieSession);
        return new Promise<boolean>((resolve) => {
            resolve(promise !== '');
        });
    }

    async logout(): Promise<void> {
        const message: Message = {
            title: 'Logout request',
            body: '',
        };
        const path = 'admin/logout';
        await this.postServerAndGetResponse(message, path);
    }
    private async postServerAndGetResponse(message: Message, path: string): Promise<string> {
        return new Promise<string>((resolve) => {
            this.communicationService.basicPost(message, path).subscribe({
                // always logout (server does not intentionally throw errors)
                next: (res) => {
                    resolve(res.body || '');
                },
                error: () => {
                    resolve('');
                },
            });
        });
    }
    private async getServerMSG(path: string): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.communicationService.basicGet(path).subscribe({
                next: (res) => {
                    resolve(!!res);
                },
                error: () => {
                    resolve(false);
                },
            });
        });
    }
}
