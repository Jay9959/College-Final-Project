import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';

@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    private apiUrl = `${environment.apiUrl}/translate`;

    constructor(private http: HttpClient) { }

    translate(text: string, targetLang: string): Observable<string> {
        if (!text) return of('');

        return this.http.post<any>(this.apiUrl, { text, targetLang }).pipe(
            map(response => {
                if (response && response.translatedText) {
                    return response.translatedText;
                }
                return text;
            }),
            catchError(error => {
                console.error('Translation error:', error);
                return of(text);
            })
        );
    }
}
