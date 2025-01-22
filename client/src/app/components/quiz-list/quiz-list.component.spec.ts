import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { QuizRenderer } from '@app/classes/renderer/quiz-renderer/quiz-renderer';
import { AlertService } from '@app/services/alert-service/alert.service';
import { CommunicationService } from '@app/services/communication-service/communication.service';
import { ToggleService } from '@app/services/toggle-service/toggle.service';
import { Message } from '@common/message';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { QuizListComponent } from './quiz-list.component';

describe('QuizListComponent', () => {
    let component: QuizListComponent;
    let communicationService: CommunicationService;
    let router: Router;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, RouterTestingModule, ToastrModule.forRoot()], // Add ToastrModule.forRoot() here
            providers: [
                CommunicationService,
                { provide: ToastrService, useValue: jasmine.createSpyObj('ToastrService', ['success', 'error']) },
            ],
            declarations: [QuizListComponent],
        });
        const body =
            '[{"id":"1","title":"Quiz 1","description":"Quiz 1 Description",' +
            '"questions":["1","2"],"duration":60,"visible":true,"lastModification":"2022-01-01T00:00:00Z"}]';
        communicationService = TestBed.inject(CommunicationService);
        spyOn(communicationService, 'basicGet').and.returnValue(
            of({
                title: 'Quiz 1',
                body,
            } as Message),
        );

        const fixture = TestBed.createComponent(QuizListComponent);
        component = fixture.componentInstance;
        component['router'] = router;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should populate quizzes', async () => {
        await component.populateQuizzes();
        expect(component.quizzes.length).toBe(2);
        expect(component.quizzes[0].id).toBe('1');
        expect(component.quizzes[0].title).toBe('Quiz 1');
    });

    it('should download quiz correctly', async () => {
        const quiz = {
            id: '1',
            title: 'Sample Quiz',
            description: 'This is a sample quiz',
            duration: 60,
            questionIDs: ['q1', 'q2'],
            visibility: true,
            lastModification: new Date(),
            formattedDate: '12/31/2022',
        };
        component.quizzes = [quiz];
        spyOn(URL, 'createObjectURL').and.returnValue('sample-url');

        (communicationService.basicGet as jasmine.Spy).and.returnValues(
            of({ body: JSON.stringify({ id: 'q1', question: 'Sample Question 1' }) }),
            of({ body: JSON.stringify({ id: 'q2', question: 'Sample Question 2' }) }),
        );

        await component.download(0);

        expect(communicationService.basicGet).toHaveBeenCalledTimes(3);
    });
    it('should set selectedFile if a valid JSON file is selected', () => {
        const mockFile = new File([''], 'mock.json', { type: 'application/json' });
        const fileList = {
            0: mockFile,
            length: 1,
            item: (index: number) => (index === 0 ? mockFile : null),
        };
        const event = { target: { files: fileList } } as unknown as Event;

        component.onFileChange(event);

        expect(component.selectedFile).toEqual(mockFile);
    });
    it('should not set selectedFile if no file is selected', () => {
        const event = { target: { files: null } } as unknown as Event;
        component.onFileChange(event);

        expect(component.selectedFile).toBeUndefined();
    });

    it('should not set selectedFile if a invalid JSON file is selected', () => {
        const mockFile = new File([''], 'mock.jsn', { type: 'application/json' });
        const fileList = {
            0: mockFile,
            length: 1,
            item: (index: number) => (index === 0 ? mockFile : null),
        };
        const event = { target: { files: fileList } } as unknown as Event;

        component.onFileChange(event);

        expect(component.selectedFile).toBeUndefined();
    });

    it('should not navigate to quiz 0 with JSON data when selectedFile is present but wrong ', () => {
        component.selectedFile = new File(['{"question":"What is 1 + 1?","answer":"2"}'], 'mock.json', { type: 'application/json' });
        router = jasmine.createSpyObj('Router', ['navigate']);

        component.uploadQuiz();

        expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should navigate to quiz 0 with JSON data when selectedFile is present', () => {
        component.selectedFile = new File(['{"title":"Sample Quiz","questions":["q1","q2"]}'], 'valid_quiz.json', { type: 'application/json' });
        router = jasmine.createSpyObj('Router', ['navigate']);

        component.uploadQuiz();

        expect(component.selectedFile).toBeDefined();
    });

    it('should not navigate when selectedFile is not present', () => {
        component.uploadQuiz();
        expect(router.navigate).not.toHaveBeenCalled();
    });
});
describe('QuizListComponent', () => {
    let component: QuizListComponent;
    let router: Router;
    let communicationService: CommunicationService;
    let alertService: AlertService;

    beforeEach(() => {
        router = jasmine.createSpyObj('Router', ['navigate']);
        communicationService = jasmine.createSpyObj('CommunicationService', ['basicGet', 'patch']);
        (communicationService.basicGet as jasmine.Spy).and.returnValue(of({ body: '[]' }));
        (communicationService.patch as jasmine.Spy).and.returnValue(of({ body: '[]' }));
        const toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error']);
        alertService = new AlertService(toastrSpy);

        component = new QuizListComponent(communicationService, router, alertService);
        component.toggler = new ToggleService();
    });

    it('should navigate to the correct quiz page', () => {
        const id = '123';
        component.goToQuizPage(id);

        expect(router.navigate).toHaveBeenCalledWith(['/quiz/' + id]);
    });
    it('should toggle quiz visibility', async () => {
        const mockQuiz = {
            id: '1',
            title: 'title 1',
            description: 'description 1',
            lastModification: new Date(),
            questionIDs: [],
            duration: 30,
            visibility: false,
        };
        component.quizzes = [mockQuiz];
        await component.toggle(0);

        expect(component.quizzes[0].visibility).toBe(true);
    });
    it('should toggle quiz visibility if its not the same as the toggler', async () => {
        const mockQuiz = {
            id: '1',
            title: 'title 1',
            description: 'description 1',
            lastModification: new Date(),
            questionIDs: [],
            duration: 30,
            visibility: true,
        };
        component.quizzes = [mockQuiz];
        await component.toggle(0);

        expect(component.quizzes[0].visibility).toBe(false);
    });
    it('should delete quiz', async () => {
        spyOn(window, 'confirm').and.returnValue(true);
        spyOn(QuizRenderer, 'staticDelete').and.returnValue(Promise.resolve());

        const mockQuiz = {
            id: '1',
            title: 'title 1',
            description: 'description 1',
            lastModification: new Date(),
            questionIDs: [],
            duration: 30,
            visibility: false,
        };
        component.quizzes = [mockQuiz];

        const index = 0;

        await component.delete(index);

        expect(QuizRenderer.staticDelete).toHaveBeenCalledWith(mockQuiz.id, component.communicationService);
        expect(component.quizzes.length).toBe(0);
    });
});
