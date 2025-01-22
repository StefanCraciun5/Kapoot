import { TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ErrorDialogComponent } from '@app/components/error-dialog/error-dialog.component';
import { of } from 'rxjs';
import { DialogService } from './dialog.service';

describe('DialogService', () => {
    let dialogService: DialogService;
    let matDialog: jasmine.SpyObj<MatDialog>;

    beforeEach(() => {
        const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

        TestBed.configureTestingModule({
            providers: [DialogService, { provide: MatDialog, useValue: matDialogSpy }],
        });

        dialogService = TestBed.inject(DialogService);
        matDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    });

    it('should be created', () => {
        expect(dialogService).toBeTruthy();
    });

    it('should open the error dialog', () => {
        const matDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        matDialogRefSpy.afterClosed.and.returnValue(of(undefined)); // Simulate dialog closure

        matDialog.open.and.returnValue(matDialogRefSpy as MatDialogRef<ErrorDialogComponent>);

        dialogService.openErrorDialog();

        expect(matDialog.open).toHaveBeenCalledWith(ErrorDialogComponent, {
            width: '800px',
        });
    });
});
