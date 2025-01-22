import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { AdminPageComponent } from './admin-page.component';
import { Router } from '@angular/router';
import { AuthService } from '@app/services/auth-service/auth.service';
import SpyObj = jasmine.SpyObj;

describe('AdminPageComponent', () => {
    let component: AdminPageComponent;
    let fixture: ComponentFixture<AdminPageComponent>;
    let authServiceSpy: SpyObj<AuthService>;
    let routerSpy: SpyObj<Router>;

    beforeEach(waitForAsync(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);

        TestBed.configureTestingModule({
            declarations: [AdminPageComponent],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: AuthService, useValue: authServiceSpy },
            ],
        }).compileComponents();
    }));

    beforeEach(fakeAsync(() => {
        fixture = TestBed.createComponent(AdminPageComponent);
        component = fixture.componentInstance;
    }));

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to login page if not logged in', fakeAsync(() => {
        authServiceSpy.isLoggedIn.and.returnValue(Promise.resolve(false));

        component.ngOnInit();
        tick();

        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    }));

    it('should not navigate if logged in', fakeAsync(() => {
        authServiceSpy.isLoggedIn.and.returnValue(Promise.resolve(true));

        component.ngOnInit();
        tick();

        expect(routerSpy.navigate).not.toHaveBeenCalled();
    }));
});
