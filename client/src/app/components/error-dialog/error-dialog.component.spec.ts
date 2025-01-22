import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ErrorDialogComponent } from './error-dialog.component';

describe('ErrorDialogComponent', () => {
    let component: ErrorDialogComponent;
    let fixture: ComponentFixture<ErrorDialogComponent>;
    let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ErrorDialogComponent>>;

    beforeEach(waitForAsync(() => {
        dialogRefSpy = jasmine.createSpyObj('MatDialogRef<ErrorDialogComponent>', ['close', 'afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of(null)); // Return an observable

        TestBed.configureTestingModule({
            imports: [MatDialogModule],
            declarations: [ErrorDialogComponent],
            providers: [{ provide: MatDialogRef, useValue: dialogRefSpy }],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ErrorDialogComponent);
        component = fixture.componentInstance;
        component.testing = true;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close the dialog when onCloseClick is called', () => {
        component.onCloseClick();
        expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('should reload on dialog close', () => {
        const locationReloadSpy = spyOn(component, 'reloadPage');
        component.testing = false;
        component.ngOnInit();
        component.testing = true;
        dialogRefSpy.afterClosed.and.returnValue(of());
        component.dialogRef.close();
        expect(locationReloadSpy).toHaveBeenCalled();
    });

    it('should reload the page if not testing', () => {
        const reloadSpy = spyOn<any>(component, 'windowReload');
        component.testing = false;
        component.reloadPage();
        expect(reloadSpy).toHaveBeenCalled();
    });
    it('should not reload the page if testing', () => {
        const reloadSpy = spyOn<any>(component, 'windowReload');
        component.testing = true;
        component.reloadPage();
        expect(reloadSpy).not.toHaveBeenCalled();
    });
});
