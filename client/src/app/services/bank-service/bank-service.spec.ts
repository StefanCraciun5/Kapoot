import { HttpResponse } from '@angular/common/http';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BankService } from '@app/services/bank-service/bank-service';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { CommunicationServiceMock } from '@app/services/communication-service/communication.service.spec';
import { of } from 'rxjs';

export class MockBankService {
    static async getBankQuestions(communicationService: CommunicationService): Promise<string> {
        // Implement mock behavior here
        const communicationServiceString = JSON.stringify(communicationService);
        return Promise.resolve(JSON.stringify(['question1', 'question2', 'question3' ?? communicationServiceString])); // Mocked response
    }
}
describe('BankService', () => {
    let bankService: BankService;
    let communicationServiceSpy: jasmine.SpyObj<CommunicationService>;

    beforeEach(() => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['basicGet', 'adminPost']);

        TestBed.configureTestingModule({
            providers: [
                BankService,
                { provide: CommunicationService, useClass: CommunicationServiceMock },
                { provide: CommunicationService, useValue: communicationServiceSpy },
            ],
        });

        bankService = TestBed.inject(BankService);
    });

    it('should be created', () => {
        expect(bankService).toBeTruthy();
    });

    it('should return the correct string', fakeAsync(async () => {
        communicationServiceSpy.basicGet.and.returnValue(of({ title: '', body: 'Mocked Response' }));

        const result = await BankService.getBankQuestions(communicationServiceSpy);

        expect(result).toEqual('Mocked Response');
    }));

    it('addToQuestionBank should resolve when adminPost succeeds', fakeAsync(() => {
        const questionId = '123';
        communicationServiceSpy.adminPost.and.returnValue(of(new HttpResponse({ status: 200, body: 'Mocked Response' })));

        let resolved = false;
        BankService.addToQuestionBank(questionId, communicationServiceSpy).then(() => {
            resolved = true;
        });
        tick();

        expect(resolved).toBeTruthy();
        expect(communicationServiceSpy.adminPost).toHaveBeenCalledWith(
            jasmine.objectContaining({
                body: jasmine.objectContaining({ question: '123' }), // Adjust this line
            }),
            'admin/question-bank',
        );
    }));
});
