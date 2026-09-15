import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    // redirect_uri: 'postmessage' es el valor especial que espera Google
    // para el code flow disparado desde JS en un popup (sin redirect real) --
    // ver loginWithGoogle().
    this.googleClient = new OAuth2Client(
      this.config.get<string>('GOOGLE_CLIENT_ID'),
      this.config.get<string>('GOOGLE_CLIENT_SECRET'),
      'postmessage',
    );
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        details: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        },
      },
    });

    return { id: user.id, email: user.email, role: user.role };
  }

  async login(dto: LoginDto, ip?: string): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Mensaje genérico a propósito: no revelar si el email existe o no
    // (evita user enumeration).
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.issueTokenPair(user.id, user.email, ip);
  }

  // "Continuar con Google": el frontend usa el code client de Google
  // Identity Services (google.accounts.oauth2.initCodeClient, popup) -- no
  // el botón pre-armado, que Google se niega a renderizar si detecta que su
  // contenedor está oculto (protección anti-clickjacking, no hay forma de
  // esconderlo detrás de un botón propio). El code client en cambio entrega
  // un authorization code que acá se intercambia por un id_token (llamada
  // servidor-a-servidor con el Client Secret) y ese sí se verifica como
  // cualquier JWT de Google -- nunca se confía en un email sin marcar como
  // verificado por Google.
  //
  // Sin campo `googleId` ni migración de schema a propósito: la tabla users
  // vive en la misma base de Supabase que usa producción, y matchear por
  // email alcanza (Google ya garantiza que ese email es del dueño de la
  // cuenta). Una cuenta creada acá recibe un passwordHash de un valor
  // aleatorio que nadie conoce -- nunca se podrá loguear con contraseña,
  // solo con Google, hasta que exista un flujo de "definir contraseña".
  async loginWithGoogle(code: string, ip?: string): Promise<TokenPair> {
    const clientId = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');

    let email: string | undefined;
    let firstName: string | undefined;
    let lastName: string | undefined;
    try {
      const { tokens } = await this.googleClient.getToken(code);
      if (!tokens.id_token) {
        throw new UnauthorizedException('Google no devolvió un id_token');
      }
      const ticket = await this.googleClient.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId,
      });
      const payload = ticket.getPayload();
      if (!payload?.email || !payload.email_verified) {
        throw new UnauthorizedException(
          'No se pudo verificar el email de Google',
        );
      }
      email = payload.email;
      firstName = payload.given_name;
      lastName = payload.family_name;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Código de Google inválido');
    }

    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      const unusablePasswordHash = await bcrypt.hash(
        randomUUID(),
        BCRYPT_ROUNDS,
      );
      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash: unusablePasswordHash,
          details: {
            create: {
              firstName: firstName ?? 'Usuario',
              lastName: lastName ?? 'Google',
            },
          },
        },
      });
    } else if (!user.isActive) {
      throw new UnauthorizedException('Cuenta inactiva');
    }

    return this.issueTokenPair(user.id, user.email, ip);
  }

  // Rotación de refresh token + detección de reuso.
  //
  // Si el token presentado ya fue usado antes (existe en la tabla pero tiene
  // `replacedByTokenHash` seteado), es señal de que alguien está reutilizando
  // un token robado -> se revocan TODAS las sesiones del usuario.
  async refresh(refreshTokenPlain: string, ip?: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshTokenPlain);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado o revocado');
    }

    if (stored.replacedByTokenHash) {
      // Reuso de un token ya rotado: posible robo de sesión.
      await this.revokeAllUserTokens(stored.userId);
      throw new UnauthorizedException(
        'Reuso de refresh token detectado. Todas las sesiones fueron revocadas.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuario no válido');
    }

    const newPair = await this.issueTokenPair(user.id, user.email, ip);
    const newHash = this.hashToken(newPair.refreshToken);

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { replacedByTokenHash: newHash },
    });

    return newPair;
  }

  async logout(refreshTokenPlain: string): Promise<void> {
    const tokenHash = this.hashToken(refreshTokenPlain);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokenPair(
    userId: string,
    email: string,
    ip?: string,
  ): Promise<TokenPair> {
    const accessToken = this.jwt.sign(
      { sub: userId, email },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      },
    );

    // jti aleatorio: sin esto, dos llamadas a issueTokenPair() para el mismo
    // usuario dentro del mismo segundo (ej. el efecto de montaje de
    // AuthProvider disparándose dos veces por React Strict Mode, o dos tabs
    // haciendo login/refresh casi a la vez) firman un JWT IDÉNTICO -- mismo
    // payload, mismo `iat` (resolución de segundo) -> mismo hash -> el
    // segundo INSERT en refresh_tokens choca contra el @unique(tokenHash) y
    // revienta con 409 en vez de emitir un segundo token válido.
    const refreshToken = this.jwt.sign(
      { sub: userId, jti: randomUUID() },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    const expiresAt = this.addDuration(
      new Date(),
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    );

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId,
        expiresAt,
        createdByIp: ip,
      },
    });

    return { accessToken, refreshToken };
  }

  // Los refresh tokens ya son de alta entropía (JWT firmado), así que un hash
  // determinístico simple (sha256) es suficiente para poder buscarlos por
  // igualdad en la tabla sin guardar el token en claro. No usamos bcrypt acá
  // porque bcrypt está pensado para secretos de baja entropía (contraseñas).
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private addDuration(base: Date, duration: string): Date {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(
        `Formato de duración inválido: "${duration}" (usar ej. "15m", "7d")`,
      );
    }
    const [, amountStr, unit] = match;
    const amount = Number(amountStr);
    const msByUnit: Record<string, number> = {
      s: 1000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return new Date(base.getTime() + amount * msByUnit[unit]);
  }
}
