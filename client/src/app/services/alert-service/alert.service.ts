import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
    providedIn: 'root',
})
export class AlertService {
    constructor(
        private toastr: ToastrService, // private readonly router: Router,
    ) {}

    showSuccess(message: string, title?: string): void {
        this.toastr.success(message, title);
    }

    showError(message: string, title?: string): void {
        this.toastr.error(message, title);
    }
}
