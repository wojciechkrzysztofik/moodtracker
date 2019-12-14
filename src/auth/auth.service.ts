import * as jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UsersService) { }

  async createToken(id: number, email: string) {
    const expiresIn = 60 * 60;
    const secretOrKey = 'secret';
    const user = { email };
    const token = jwt.sign(user, secretOrKey, { expiresIn });

    return { expires_in: expiresIn, token, email };
  }

  async validateUser(signedUser): Promise<boolean> {
    if (signedUser&&signedUser.email) {
      return Boolean(this.userService.getUserByEmail(signedUser.email));
    }

    return false;
  }
}