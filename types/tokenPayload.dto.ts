// formatting these similar to the endpoint `operation` for now
export type TokenPayloadAction = 'request-password-reset' | 'send-invitation';

export type TokenPayloadDto = {
  id?: string;
  token: string;
  action: TokenPayloadAction;
  expiresDate: string; // TODO use some IsoDateString type 
  payload: Record<string, any>;
}
