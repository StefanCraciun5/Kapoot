import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { BankPageComponent } from '@app/pages/bank-page/bank-page.component';
import { ErrorPageComponent } from '@app/pages/error-page/error-page.component';
import { GameOrgPageComponent } from '@app/pages/game-org-page/game-org-page.component';
import { HistoryPageComponent } from '@app/pages/history-page/history-page.component';
import { JoinGamePageComponent } from '@app/pages/join-game-page/join-game-page.component';
import { LoginPageComponent } from '@app/pages/login-page/login-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { PlayerViewPageComponent } from '@app/pages/player-view-page/player-view-page.component';
import { QuizPageComponent } from '@app/pages/quiz-page/quiz-page.component';
import { SocketClientService } from '@app/services/socket-client-service/socket-client.service';

import { ToastrModule } from 'ngx-toastr';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'login', component: LoginPageComponent },
    { path: 'admin', component: AdminPageComponent },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'bank', component: BankPageComponent },
    { path: 'history', component: HistoryPageComponent },
    { path: 'join-game', component: JoinGamePageComponent },
    { path: 'player-view', component: PlayerViewPageComponent },
    { path: 'waiting-room', component: GameOrgPageComponent },
    { path: 'quiz/:id', component: QuizPageComponent },
    { path: 'error/:code', component: ErrorPageComponent },
    { path: '**', redirectTo: '/home' },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, { useHash: true }),
        FormsModule,
        MatSliderModule,
        BrowserAnimationsModule, // required for ToastrModule
        ToastrModule.forRoot(),
    ],
    exports: [RouterModule],
    providers: [SocketClientService],
})
export class AppRoutingModule {}
