
export interface IExchangeResponse {
    expires_at: number;
    expires_in: number;
    refresh_token: string;
    access_token: string;
    athlete: {
        id: number;
        username: string;
        firstname: string;
        lastname: string;
    }
}