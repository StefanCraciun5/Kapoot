import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { MainPageComponent } from './main-page.component';

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let routerSpy: jasmine.SpyObj<Router>;
    let matDialogSpy: jasmine.SpyObj<MatDialog>;

    beforeEach(() => {
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

        component = new MainPageComponent(routerSpy, matDialogSpy);
    });

    it('should navigate to join-game page', () => {
        component.navigateToJoinGamePage();

        expect(routerSpy.navigate).toHaveBeenCalledWith(['/join-game']);
    });

    it('should open modal', () => {
        const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of());

        matDialogSpy.open.and.returnValue(dialogRefSpy);

        component.openModal();

        expect(matDialogSpy.open).toHaveBeenCalled();
        expect(dialogRefSpy.afterClosed).toHaveBeenCalled();
    });
});
