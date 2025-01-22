import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AdminQuestionComponent } from '@app/components/admin-question/admin-question.component';
import { QuestionEditComponent } from '@app/components/admin-question/question-edit/question-edit.component';
import { QuestionViewComponent } from '@app/components/admin-question/question-view/question-view.component';
import { AppFooterComponent } from '@app/components/footer/app-footer.component';
import { AppHeaderComponent } from '@app/components/header/app-header.component';
import { PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AppComponent } from '@app/pages/app/app.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { AddQCMComponent } from './components/add-qcm/add-qcm.component';
import { AdminQuizComponent } from './components/admin-quiz/admin-quiz.component';
import { QuizEditComponent } from './components/admin-quiz/quiz-edit/quiz-edit.component';
import { QuizViewComponent } from './components/admin-quiz/quiz-view/quiz-view.component';
import { BankDialogComponent } from './components/bank-dialog/bank-dialog.component';
import { ChatAreaComponent } from './components/chat-area/chat-area.component';
import { CurrentQuestionInfoComponent } from './components/current-question-info/current-question-info.component';
import { ErrorDialogComponent } from './components/error-dialog/error-dialog.component';
import { EvaluatingLAQComponent } from './components/evaluating-laq/evaluating-laq.component';
import { FinalResultsComponent } from './components/final-results/final-results.component';
import { GameOrganisateurComponent } from './components/game-organisateur-page/game-organisateur.component';
import { GameQuestionComponent } from './components/game-question/game-question.component';
import { GameResultComponent } from './components/game-result/game-result.component';
import { GameTransitionComponent } from './components/game-transition/game-transition.component';
import { JoinGameCodeComponent } from './components/join-game-code/join-game-code.component';
import { JoinGameUsernameComponent } from './components/join-game-username/join-game-username.component';
import { MenuComponent } from './components/menu/menu.component';
import { PlayersListComponent } from './components/players-list/players-list.component';
import { PreGameWaitComponent } from './components/pre-game-wait/pre-game-wait.component';
import { PreviewQuestionComponent } from './components/preview-question/preview-question.component';
import { QuestionListComponent } from './components/question-list/question-list.component';
import { QuizListComponent } from './components/quiz-list/quiz-list.component';
import { StartQuizModalComponent } from './components/start-quiz-modal/start-quiz-modal.component';
import { StatsComponent } from './components/stats/stats.component';
import { UsernameListComponent } from './components/username-list/username-list.component';
import { WaitRoomComponent } from './components/wait-room/wait-room.component';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { BankPageComponent } from './pages/bank-page/bank-page.component';
import { ErrorPageComponent } from './pages/error-page/error-page.component';
import { GameOrgPageComponent } from './pages/game-org-page/game-org-page.component';
import { HistoryPageComponent } from './pages/history-page/history-page.component';
import { JoinGamePageComponent } from './pages/join-game-page/join-game-page.component';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { PlayerViewPageComponent } from './pages/player-view-page/player-view-page.component';
import { QuizPageComponent } from './pages/quiz-page/quiz-page.component';

/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        MainPageComponent,
        PlayAreaComponent,
        SidebarComponent,
        AdminPageComponent,
        AppHeaderComponent,
        AppFooterComponent,
        LoginPageComponent,
        BankPageComponent,
        QuestionListComponent,
        BankDialogComponent,
        AddQCMComponent,
        PlayerViewPageComponent,
        ChatAreaComponent,
        GameOrgPageComponent,
        ErrorDialogComponent,
        AdminQuestionComponent,
        QuestionViewComponent,
        QuestionEditComponent,
        AdminQuizComponent,
        QuizListComponent,
        QuizPageComponent,
        ErrorPageComponent,
        QuizViewComponent,
        QuizEditComponent,
        AdminQuestionComponent,
        QuestionViewComponent,
        QuestionEditComponent,
        AdminQuizComponent,
        QuizListComponent,
        QuizPageComponent,
        ErrorPageComponent,
        QuizViewComponent,
        QuizEditComponent,
        JoinGamePageComponent,
        JoinGameCodeComponent,
        JoinGameUsernameComponent,
        UsernameListComponent,
        WaitRoomComponent,
        GameOrganisateurComponent,
        CurrentQuestionInfoComponent,
        PlayersListComponent,
        PreviewQuestionComponent,
        StatsComponent,
        GameResultComponent,
        GameQuestionComponent,
        GameTransitionComponent,
        PreGameWaitComponent,
        FinalResultsComponent,
        EvaluatingLAQComponent,
        StartQuizModalComponent,
        MenuComponent,
        HistoryPageComponent,
    ],
    imports: [
        AppMaterialModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        ReactiveFormsModule,
        MatDialogModule,
        DragDropModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
