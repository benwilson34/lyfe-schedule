export type TokenPayloadDto = {
  id?: string;
  token: string;
  userId: string;
  expiresDate: string; // TODO use some IsoDateString type 
}
