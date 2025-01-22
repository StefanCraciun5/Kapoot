import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { Message } from '@common/message';
import { CookieService } from 'ngx-cookie-service';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let authService: AuthService;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;
    let cookieServiceSpy: jasmine.SpyObj<CookieService>;

    beforeEach(() => {
        const communicationServiceSpyObj = jasmine.createSpyObj('CommunicationService', ['basicPost', 'basicGet']);
        const cookieServiceSpyObj = jasmine.createSpyObj('CookieService', ['set', 'get', 'delete']);

        TestBed.configureTestingModule({
            providers: [
                AuthService,
                { provide: CommunicationService, useValue: communicationServiceSpyObj },
                { provide: CookieService, useValue: cookieServiceSpyObj },
            ],
        });

        authService = TestBed.inject(AuthService);
        communicationServiceSpy = TestBed.inject(CommunicationService) as jasmine.SpyObj<CommunicationService>;
        cookieServiceSpy = TestBed.inject(CookieService) as jasmine.SpyObj<CookieService>;
    });

    it('should be created', () => {
        expect(authService).toBeTruthy();
    });

    describe('isLoggedIn', () => {
        it('should return true when the server responds successfully', async () => {
            communicationServiceSpy.basicGet.and.returnValue(of({ title: 'mock' } as Message));

            const result = await authService.isLoggedIn();

            expect(result).toBe(true);
            expect(communicationServiceSpy.basicGet).toHaveBeenCalledWith('admin/ping');
        });

        it('should return false when the server responds with an error', async () => {
            communicationServiceSpy.basicGet.and.returnValue(throwError(() => 'Server error'));

            const result = await authService.isLoggedIn();

            expect(result).toBe(false);
            expect(communicationServiceSpy.basicGet).toHaveBeenCalledWith('admin/ping');
        });
    });

    describe('login', () => {
        it('should set the cookie and return true when the server responds successfully', async () => {
            const mockResponse = { cookieSession: 'mockCookie' };
            communicationServiceSpy.basicPost.and.returnValue(of(new HttpResponse<string>({ body: JSON.stringify(mockResponse) })));

            const result = await authService.login('password');

            expect(result).toBe(true);
            expect(cookieServiceSpy.set).toHaveBeenCalledWith('kapoot', mockResponse.cookieSession);
            expect(communicationServiceSpy.basicPost).toHaveBeenCalledWith({ title: 'Login request', body: 'password' }, 'admin/login');
        });

        // it('should return false when the server responds with an error', async () => {
        //     communicationServiceSpy.basicPost.and.returnValue(throwError(() => 'Server error'));

        //     const result = await authService.login('password');

        //     expect(result).toBe(false);
        //     expect(cookieServiceSpy.set).not.toHaveBeenCalled();
        //     expect(communicationServiceSpy.basicPost).toHaveBeenCalledWith({ title: 'Login request', body: 'password' }, 'admin/login');
        // });
    });

    describe('logout', () => {
        it('should send a logout request to the server', async () => {
            communicationServiceSpy.basicPost.and.returnValue(of(new HttpResponse<string>({ body: '' })));

            await authService.logout();

            expect(communicationServiceSpy.basicPost).toHaveBeenCalledWith({ title: 'Logout request', body: '' }, 'admin/logout');
        });

        it('should handle errors gracefully', async () => {
            communicationServiceSpy.basicPost.and.returnValue(throwError(() => 'Server error'));

            await authService.logout();

            expect(communicationServiceSpy.basicPost).toHaveBeenCalledWith({ title: 'Logout request', body: '' }, 'admin/logout');
        });
    });
});
