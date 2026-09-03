import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

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

    const refreshToken = this.jwt.sign(
      { sub: userId },
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
