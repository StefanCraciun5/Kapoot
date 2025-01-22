import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-error-dialog',
    templateUrl: './error-dialog.component.html',
    styleUrls: ['./error-dialog.component.scss'],
})
export class ErrorDialogComponent implements OnInit {
    testing: boolean = false;
    constructor(public dialogRef: MatDialogRef<ErrorDialogComponent>) {}

    ngOnInit(): void {
        this.dialogRef.afterClosed().subscribe(() => {
            this.reloadPage();
        });
    }

    onCloseClick(): void {
        this.dialogRef.close();
    }

    reloadPage(): void {
        if (!this.testing) {
            this.windowReload();
        }
    }
    private windowReload() {
        window.location.reload();
    }
}
