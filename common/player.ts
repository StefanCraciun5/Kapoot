export interface Player {
    username: string;
    points: number;
    goodAnswer: boolean;
    isFinal: boolean;
    isSubmitted: boolean;
    isConnected: boolean;
    isMuted: boolean;
    nBonus: number;
    isAnswering: boolean;
    hasTyped?: boolean;
    isDone?: boolean;
    deltaTHeartBeat?: number;
    currentLAQPoints?: number;
}

export interface ValidateLAQ {
    username: string;
    percentage: number;
}
