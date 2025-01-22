import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '@app/services/auth-service/auth.service';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { of } from 'rxjs';
import { LoginPageComponent } from './login-page.component';
import SpyObj = jasmine.SpyObj;

describe('LoginPageComponent', () => {
    let component: LoginPageComponent;
    let fixture: ComponentFixture<LoginPageComponent>;
    let routerSpy: SpyObj<Router>;
    let authServiceSpy: SpyObj<AuthService>;
    let communicationServiceSpy: SpyObj<CommunicationService>;

    beforeEach(waitForAsync(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'postServerAndGetResponse']);
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['basicPost']);

        TestBed.configureTestingModule({
            declarations: [LoginPageComponent],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: AuthService, useValue: authServiceSpy },
                { provide: CommunicationService, useValue: communicationServiceSpy },
            ],
            imports: [HttpClientTestingModule],
        }).compileComponents();
    }));

    beforeEach(fakeAsync(() => {
        fixture = TestBed.createComponent(LoginPageComponent);
        component = fixture.componentInstance;
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to admin page if login is successful', fakeAsync(() => {
        const mockResponse = '{"cookieSession": "mockCookieSession"}';
        authServiceSpy.login.and.returnValue(Promise.resolve(false));
        routerSpy.navigate.and.stub();
        communicationServiceSpy.basicPost.and.returnValue(of(new HttpResponse({ body: mockResponse })));

        component.inputPassword = 'invalidPassword';
        component.authenticate();
        tick();

        expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
    }));

    it('should not navigate if login fails', fakeAsync(() => {
        authServiceSpy.login.and.returnValue(Promise.resolve(false));
        routerSpy.navigate.and.stub();
        communicationServiceSpy.basicPost.and.returnValue(of());

        component.inputPassword = 'invalidPassword';
        component.authenticate();
        tick();

        expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));
    it('should handle authentication failure', async () => {
        component.inputPassword = 'invalidPassword';

        await component.authenticate();

        expect(component.isInvalidePW).toBe(false);
        expect(component.inputPassword).not.toBe('');
    });
    it('should not attempt authentication with empty password', async () => {
        await component.authenticate();

        expect(authServiceSpy.login).not.toHaveBeenCalled();
    });
});
