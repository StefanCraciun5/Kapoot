import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { HistoryObj } from '@common/message';
import { HistoryPageComponent } from './history-page.component';
import { RANDOMIZER } from '@common/constant';

describe('HistoryPageComponent', () => {
    let component: HistoryPageComponent;
    let fixture: ComponentFixture<HistoryPageComponent>;
    let mockCommunicationService: jasmine.SpyObj<CommunicationService>;

    beforeEach(() => {
        mockCommunicationService = jasmine.createSpyObj('CommunicationService', ['getHistory', 'deleteHistory']);

        TestBed.configureTestingModule({
            declarations: [HistoryPageComponent],
            providers: [{ provide: CommunicationService, useValue: mockCommunicationService }],
            imports: [HttpClientTestingModule],
        });

        fixture = TestBed.createComponent(HistoryPageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should fetch and initialize history on ngOnInit', async () => {
        const history: HistoryObj[] = [
            { title: 'Game 1', date: new Date('2024-04-01'), players: 3, maxPoints: 100 },
            { title: 'Game 2', date: new Date('2024-04-02'), players: 4, maxPoints: 150 },
        ];
        mockCommunicationService.getHistory.and.returnValue(Promise.resolve(history));

        await component.ngOnInit();

        expect(mockCommunicationService.getHistory).toHaveBeenCalled();
        expect(component.history).toEqual(history);
        expect(component.original).toEqual(history);
        expect(component.formattedDates.length).toBe(2);
    });

    it('should clear history', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        component.clearHistory();

        expect(mockCommunicationService.deleteHistory).toHaveBeenCalled();
        expect(component.history.length).toBe(0);
    });

    describe('HistoryPageComponent', () => {
        it('should sort history by alphabet', () => {
            const history: HistoryObj[] = [
                { title: 'B', date: new Date('2024-04-01'), players: 3, maxPoints: 100 },
                { title: 'A', date: new Date('2024-04-02'), players: 4, maxPoints: 150 },
            ];
            component.history = history;
            component.sortByAlphabet();

            expect(component.sortAlphabet).toBe(true);
            expect(component.sortDate).toBe(false);
            expect(component.history).toEqual([
                { title: 'A', date: new Date('2024-04-02'), players: 4, maxPoints: 150 },
                { title: 'B', date: new Date('2024-04-01'), players: 3, maxPoints: 100 },
            ]);
        });

        it('should sort history by date', () => {
            const history: HistoryObj[] = [
                { title: 'Game 1', date: new Date('2024-04-02'), players: 3, maxPoints: 100 },
                { title: 'Game 2', date: new Date('2024-04-01'), players: 4, maxPoints: 150 },
            ];
            component.history = history;
            component.sortByDate();

            expect(component.sortDate).toBe(true);
            expect(component.sortAlphabet).toBe(false);
            expect(component.history).toEqual([
                { title: 'Game 2', date: new Date('2024-04-01'), players: 4, maxPoints: 150 },
                { title: 'Game 1', date: new Date('2024-04-02'), players: 3, maxPoints: 100 },
            ]);
        });

        it('should reverse history', () => {
            const history: HistoryObj[] = [
                { title: 'Game 1', date: new Date('2024-04-01'), players: 3, maxPoints: 100 },
                { title: 'Game 2', date: new Date('2024-04-02'), players: 4, maxPoints: 150 },
            ];
            component.history = history;
            component.reverse = false;
            component.sortReverse();

            expect(component.reverse).toBe(true);
            expect(component.history).toEqual([
                { title: 'Game 2', date: new Date('2024-04-02'), players: 4, maxPoints: 150 },
                { title: 'Game 1', date: new Date('2024-04-01'), players: 3, maxPoints: 100 },
            ]);
        });
    });
    describe('HistoryPageComponent', () => {
        it('should sort history alphabetically (greater than)', () => {
            const history: HistoryObj[] = [
                { title: 'B', date: new Date('2024-04-01'), players: 3, maxPoints: 100 },
                { title: 'A', date: new Date('2024-04-02'), players: 4, maxPoints: 150 },
            ];
            component.history = history;
            component.sortAlphabet = true;
            component.sortDate = false;
            component.sort();

            expect(component.history).toEqual([
                { title: 'A', date: new Date('2024-04-02'), players: 4, maxPoints: 150 },
                { title: 'B', date: new Date('2024-04-01'), players: 3, maxPoints: 100 },
            ]);
        });

        it('should sort history alphabetically (equal to)', () => {
            const history: HistoryObj[] = [
                { title: 'A', date: new Date('2024-04-01'), players: 3, maxPoints: 100 },
                { title: 'a', date: new Date('2024-04-02'), players: 4, maxPoints: 150 },
            ];
            component.history = history;
            component.sortAlphabet = true;
            component.sortDate = false;
            component.sort();

            expect(component.history).toEqual([
                { title: 'A', date: new Date('2024-04-01'), players: 3, maxPoints: 100 },
                { title: 'a', date: new Date('2024-04-02'), players: 4, maxPoints: 150 },
            ]);
        });

        it('should sort history alphabetically (less than)', () => {
            const history: HistoryObj[] = [
                { title: 'A', date: new Date('2024-04-01'), players: 3, maxPoints: 100 },
                { title: 'B', date: new Date('2024-04-02'), players: 4, maxPoints: 150 },
            ];
            component.history = history;
            component.sortAlphabet = true;
            component.sortDate = false;
            component.sort();

            expect(component.history).toEqual([
                { title: 'A', date: new Date('2024-04-01'), players: 3, maxPoints: 100 },
                { title: 'B', date: new Date('2024-04-02'), players: 4, maxPoints: 150 },
            ]);
        });

        // Add more tests as needed for other scenarios
    });

    it('should restore original order if neither sortDate nor sortAlphabet is true', () => {
        const originalHistory: HistoryObj[] = [
            { title: 'B', date: new Date('2024-04-01'), players: 3, maxPoints: 100 },
            { title: 'A', date: new Date('2024-04-02'), players: 4, maxPoints: 150 },
        ];
        component.original = originalHistory;
        component.history = [...originalHistory]; // Copy the original history for modification
        component.sortAlphabet = false;
        component.sortDate = false;

        // Shuffle the history array to simulate a different order
        component.history = component.history.sort(() => Math.random() - RANDOMIZER);

        component.sort(); // Restore the original order

        expect(component.history).toEqual(originalHistory);
    });
});
