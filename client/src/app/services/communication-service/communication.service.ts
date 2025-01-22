import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HistoryObj, Message } from '@common/message';
import { CookieService } from 'ngx-cookie-service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class CommunicationService {
    private readonly baseUrl: string = environment.serverUrl;

    constructor(
        private readonly http: HttpClient,
        private readonly cookieManager: CookieService,
    ) {}

    basicGet(path: string): Observable<Message> {
        const cookieSession = this.cookieManager.get('kapoot');
        return (
            this.http
                // Cookies doit être majuscule pour le server
                // eslint-disable-next-line @typescript-eslint/naming-convention
                .get<Message>(`${this.baseUrl}/${path}`, { headers: new HttpHeaders({ Cookies: cookieSession }) })
                .pipe(catchError(this.handleError<Message>('basicGet')))
        );
    }

    basicGetString(path: string): Observable<string> {
        const cookieSession = this.cookieManager.get('kapoot');

        return (
            this.http
                // eslint-disable-next-line @typescript-eslint/naming-convention
                .get<string>(`${this.baseUrl}/${path}`, { headers: new HttpHeaders({ Cookies: cookieSession }) })
                .pipe(catchError(this.handleError<string>('basicGet')))
        );
    }

    basicPost(message: Message, path: string): Observable<HttpResponse<string>> {
        return this.http.post(`${this.baseUrl}/${path}`, message, { observe: 'response', responseType: 'text' });
    }
    adminPost(message: Message, path: string): Observable<HttpResponse<string>> {
        const cookieSession = this.cookieManager.get('kapoot');
        return this.http.post(`${this.baseUrl}/${path}`, message, {
            observe: 'response',
            responseType: 'text',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: new HttpHeaders({ Cookies: cookieSession }),
        });
    }
    patch(message: Message, path: string): Observable<HttpResponse<string>> {
        const cookieSession = this.cookieManager.get('kapoot');
        return this.http.patch(`${this.baseUrl}/${path}`, message, {
            observe: 'response',
            responseType: 'text',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: new HttpHeaders({ Cookies: cookieSession }),
        });
    }
    delete(path: string) {
        const cookieSession = this.cookieManager.get('kapoot');
        const options = {
            headers: new HttpHeaders({
                observe: 'response',
                responseType: 'text',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                Cookies: cookieSession,
            }),
        };
        return this.http.delete(`${this.baseUrl}/${path}`, options);
    }

    async getHistory(): Promise<HistoryObj[]> {
        return new Promise<HistoryObj[]>((resolve) => {
            this.basicGet('admin/history').subscribe({
                next: (res) => {
                    resolve(JSON.parse(res.body));
                },
                error: () => {
                    resolve([]);
                },
            });
        });
    }

    async deleteHistory(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.delete('admin/history').subscribe({
                next: () => {
                    resolve();
                },
                error: () => {
                    resolve();
                },
            });
        });
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
