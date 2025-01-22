import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AddQCMComponent } from './add-qcm.component';

describe('AddQCMComponent', () => {
    let component: AddQCMComponent;
    let fixture: ComponentFixture<AddQCMComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [AddQCMComponent],
            imports: [HttpClientTestingModule],
        });
        fixture = TestBed.createComponent(AddQCMComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
