import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { StartQuizModalComponent } from '@app/components/start-quiz-modal/start-quiz-modal.component';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
    readonly title: string = 'LOG2990';
    message: BehaviorSubject<string> = new BehaviorSubject<string>('');

    constructor(
        private readonly router: Router,
        private matDialogue: MatDialog,
    ) {}

    navigateToJoinGamePage(): void {
        this.router.navigate(['/join-game']);
    }
    openModal() {
        const dialogRef = this.matDialogue.open(StartQuizModalComponent);
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        dialogRef.afterClosed().subscribe(() => {});
    }
}
