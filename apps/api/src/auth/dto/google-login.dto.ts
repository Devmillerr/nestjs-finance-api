import { IsString, MinLength } from 'class-validator';

export class GoogleLoginDto {
  // Authorization code del popup de Google (code client, no ID token) --
  // ver la nota en AuthService.loginWithGoogle().
  @IsString()
  @MinLength(1)
  code: string;
}
