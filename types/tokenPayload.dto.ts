export type TokenPayloadDto = {
  id?: string;
  token: string;
  expiresDate: string; // TODO use some IsoDateString type 
  payload: Record<string, any>;
}
