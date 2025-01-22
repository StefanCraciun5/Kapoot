import { HttpClient, HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { Message } from '@common/message';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CommunicationServiceMock {
    basicGet(path: string): Observable<Message> {
        return of({ title: '', body: path });
    }

    basicPost(message: Message, path: string): Observable<HttpResponse<string>> {
        return of(new HttpResponse({ status: 200, body: path + JSON.stringify(message) }));
    }
}

describe('CommunicationService', () => {
    let httpMock: HttpTestingController;
    let service: CommunicationService;
    let baseUrl: string;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
        });
        service = TestBed.inject(CommunicationService);
        httpMock = TestBed.inject(HttpTestingController);
        // eslint-disable-next-line dot-notation -- baseUrl is private and we need access for the test
        baseUrl = service['baseUrl'];
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return expected message (HttpClient called once)', () => {
        const expectedMessage: Message = { body: 'Hello', title: 'World' };
        const path = 'example';
        // check the content of the mocked call
        service.basicGet(path).subscribe({
            next: (response: Message) => {
                expect(response.title).toEqual(expectedMessage.title);
                expect(response.body).toEqual(expectedMessage.body);
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/example`);
        expect(req.request.method).toBe('GET');
        req.flush(expectedMessage);
    });

    it('should not return any message when sending a POST request (HttpClient called once)', () => {
        const sentMessage: Message = { body: 'Hello', title: 'World' };
        const path = 'example/send';
        service.basicPost(sentMessage, path).subscribe({
            next: () => {
                return;
            },
            error: fail,
        });
        const req = httpMock.expectOne(`${baseUrl}/example/send`);
        expect(req.request.method).toBe('POST');
        req.flush(sentMessage);
    });

    it('should handle http error safely', () => {
        const path = 'example';
        service.basicGet(path).subscribe({
            next: (response: Message) => {
                expect(response).toBeUndefined();
            },
            error: fail,
        });

        const req = httpMock.expectOne(`${baseUrl}/example`);
        expect(req.request.method).toBe('GET');
        req.error(new ProgressEvent('Random error occurred'));
    });

    it('should return expected string (adminPost)', (done) => {
        const path = 'example/admin';
        const sentMessage: Message = { body: 'Hello', title: 'World' };
        const expectedResponse = 'Admin Response';

        service.adminPost(sentMessage, path).subscribe({
            next: (response: HttpResponse<string>) => {
                expect(response.body).toEqual(expectedResponse);
            },
            error: (error) => {
                fail(error);
                done();
            },
            complete: () => {
                done();
            },
        });

        const req = httpMock.expectOne(`${baseUrl}/example/admin`);
        expect(req.request.method).toBe('POST');
        req.flush(expectedResponse);
    });

    it('should return expected string (patch)', (done) => {
        const path = 'example/patch';
        const sentMessage: Message = { body: 'Hello', title: 'World' };
        const expectedResponse = 'Patch Response';

        service.patch(sentMessage, path).subscribe({
            next: (response: HttpResponse<string>) => {
                expect(response.body).toEqual(expectedResponse);
            },
            error: (error) => {
                fail(error);
                done();
            },
            complete: () => {
                done();
            },
        });

        const req = httpMock.expectOne(`${baseUrl}/example/patch`);
        expect(req.request.method).toBe('PATCH');
        req.flush(expectedResponse);
    });

    it('should return expected string (delete)', () => {
        const path = 'example/delete';
        const expectedResponse = 'Delete Response';

        service.delete(path).subscribe((reponse) => {
            expect(reponse).toEqual(expectedResponse);
        });
        const req = httpMock.expectOne(`${baseUrl}/example/delete`);
        expect(req.request.method).toBe('DELETE');
        req.flush(expectedResponse);
    });

    it('should return expected string (basicGetString)', () => {
        const path = 'example/string';
        const expectedResponse = 'String Response';
        service.basicGetString(path).subscribe((reponse) => {
            expect(reponse).toEqual(expectedResponse);
        });

        const req = httpMock.expectOne(`${baseUrl}/example/string`);
        expect(req.request.method).toBe('GET');
        req.flush(expectedResponse);
    });

    describe('CommunicationService', () => {
        let httpClientSpy: { get: jasmine.Spy; post: jasmine.Spy; patch: jasmine.Spy; delete: jasmine.Spy };
        let cookieServiceSpy: { get: jasmine.Spy };
        let communicationService: CommunicationService;

        beforeEach(() => {
            httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch', 'delete']);
            cookieServiceSpy = jasmine.createSpyObj('CookieService', ['get']);

            communicationService = new CommunicationService(httpClientSpy as unknown as HttpClient, cookieServiceSpy as unknown as CookieService);
        });

        describe('getHistory', () => {
            it('should return history objects on success', async () => {
                const historyObj = [{ title: 'History', date: new Date(), players: 5, maxPoints: 10 }];
                const httpResponse = { body: JSON.stringify(historyObj) } as HttpResponse<string>;
                httpClientSpy.get.and.returnValue(of(httpResponse));

                // const result = await communicationService.getHistory();

                // expect(result).toEqual(historyObj);
            });

            it('should return an empty array on error', async () => {
                httpClientSpy.get.and.returnValue(of({})); // Simulate an error response

                // const result = await communicationService.getHistory();

                // expect(result).toEqual([]);
            });
        });

        describe('deleteHistory', () => {
            it('should resolve on success', async () => {
                httpClientSpy.delete.and.returnValue(of({}));

                await communicationService.deleteHistory();

                expect(httpClientSpy.delete).toHaveBeenCalled();
            });

            it('should resolve on error', async () => {
                httpClientSpy.delete.and.returnValue(of({})); // Simulate an error response

                await communicationService.deleteHistory();

                expect(httpClientSpy.delete).toHaveBeenCalled();
            });
        });

        describe('handleError', () => {
            it('should return a function that handles errors', () => {
                const request = 'someRequest';
                const result = 'someResult';
                const errorHandler = communicationService['handleError'](request, result);

                const resultObservable = errorHandler(new Error('Some error'));

                resultObservable.subscribe({
                    next: (res) => expect(res).toEqual(result),
                    error: () => fail('Should not have error in this case'),
                });
            });
        });
    });
});
