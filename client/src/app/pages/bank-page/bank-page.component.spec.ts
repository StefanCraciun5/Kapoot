import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { BankPageComponent } from './bank-page.component';
import { Router } from '@angular/router';
import { AuthService } from '@app/services/auth-service/auth.service';
import { BankService } from '@app/services/bank-service/bank-service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { of } from 'rxjs';
import SpyObj = jasmine.SpyObj;

describe('BankPageComponent', () => {
    let component: BankPageComponent;
    let fixture: ComponentFixture<BankPageComponent>;
    let authServiceSpy: SpyObj<AuthService>;
    let routerSpy: SpyObj<Router>;
    let communicationServiceSpy: SpyObj<CommunicationService>;

    beforeEach(waitForAsync(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['basicGet']);

        TestBed.configureTestingModule({
            declarations: [BankPageComponent],
            providers: [
                { provide: Router, useValue: routerSpy },
                { provide: AuthService, useValue: authServiceSpy },
                { provide: CommunicationService, useValue: communicationServiceSpy },
            ],
            imports: [HttpClientTestingModule],
        }).compileComponents();

        spyOn(BankService, 'getBankQuestions').and.returnValue(Promise.resolve('[{"question":"Q1"},{"question":"Q2"}]'));
    }));

    beforeEach(fakeAsync(() => {
        fixture = TestBed.createComponent(BankPageComponent);
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

    it('should load question IDs if logged in', fakeAsync(() => {
        authServiceSpy.isLoggedIn.and.returnValue(Promise.resolve(true));

        communicationServiceSpy.basicGet.and.returnValue(of({ title: '', body: '[{"question":"Q1"},{"question":"Q2"}]' }));

        component.ngOnInit();
        tick();

        expect(component.questionIDs).toEqual(['Q1', 'Q2']);
    }));
});
