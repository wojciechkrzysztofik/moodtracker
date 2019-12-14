import { Controller, Post, Param,HttpStatus, HttpCode, Get, Response, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailerService } from '@nest-modules/mailer';
import { User } from '../users/user.entity';
import { ApiImplicitParam, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailerService: MailerService,
    private readonly userService: UsersService) {}

  @Post('login')
  @ApiImplicitParam({ name: 'password', type: 'string' })
  @ApiImplicitParam({ name: 'email', type: 'string' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  async loginUser(@Response() res: any, @Body() body: User) {
    if (!(body && body.email && body.password)) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Email and password are required!' });
    }

    const user = await this.userService.getUserByEmail(body.email);

    if (user) {
      if (await this.userService.compareHash(body.password, user.passwordHash)) {
        return res.status(HttpStatus.OK).json(await this.authService.createToken(user.id, user.email));
      }
    }

    return res.status(HttpStatus.FORBIDDEN).json({ message: 'Email or password wrong!' });
  }

  @Post('register')
  async registerUser(@Response() res: any, @Body() body: User) {
    if (!(body && body.email && body.password)) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Email and password are required!' });
    }

    let user = await this.userService.getUserByEmail(body.email);

    if (user) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Email exists' });
    } else {
      user = await this.userService.createUser(body);
      if (user) {
        this
        .mailerService
        .sendMail({
        //   to: user.email,
          to: 'wkrzysztofik@icloud.com',
          from: 'info@moodtracker.pl',
          subject: 'moodtracker - Aktywuj swoje konto ✔',
          template: 'activation',
          context: {
              userId: user.id,
              token: encodeURIComponent(user.activationToken)
          }
        })

        user.passwordHash = undefined;
      }
    }

    return res.status(HttpStatus.OK).json(user);
  }

  @Post('activate')
  async activateUser(@Response() res: any, @Body() body: any) {
    let user = await this.userService.getUserByIdAndActivationToken(body.userId, body.token)
    if (user.length) {
      // account is already activated
      if (user[0].isActivated) {
        return res.status(HttpStatus.FORBIDDEN).json({ message: 'already activated' });
      }
      // activate account and notify user by email
      else {
        this.userService.activateUser(body.userId, body.token)
  
        this
        .mailerService
        .sendMail({
        //   to: user.email,
          to: 'wkrzysztofik@icloud.com',
          from: 'info@moodtracker.pl',
          subject: 'moodtracker - Konto zostało aktywowane ✔',
          template: 'activated'
        })
  
        return res.status(HttpStatus.OK).json(user);
      }
    } else {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'wrong id or token' });
    }
  }

  @Post('reset-password')
  async resetPassword(@Response() res: any, @Body() body: any) {
    if (!(body && body.email)) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Email is required!' });
    }

    let user = await this.userService.getUserByEmail(body.email);

    if (!user) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'user doesn\'t exist' });
    }

    let token = await this.userService.resetPassword(body.email)

    this
    .mailerService
    .sendMail({
    //   to: user.email,
      to: 'wkrzysztofik@icloud.com',
      from: 'info@moodtracker.pl',
      subject: 'moodtracker - Ustaw nowe hasło ✔',
      template: 'forgot-password',
      context: {
          userId: user.id,
          token: encodeURIComponent(token)
      }
    })

    return res.status(HttpStatus.OK).json(user)
  }

  @Post('check-password-token')
  async checkPasswordToken(@Response() res: any, @Body() body: any) {
    if (!(body && body.userId && body.token)) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'User ID and token are required!' });
    }

    let user = await this.userService.getUserByIdAndResetPasswordToken(body.userId, body.token);

    if (user.length === 0) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'user doesn\'t exist' });
    } else {
      return res.status(HttpStatus.OK).json(user)
    }
  }

  @Post('create-new-password')
  async createNewPassword(@Response() res: any, @Body() body: any) {
    if (!(body && body.password && body.userId && body.token)) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Password, user id and token are required!' });
    }

    let user = await this.userService.getUserByIdAndResetPasswordToken(body.userId, body.token);

    if (user.length === 0) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'user doesn\'t exist' });
    }

    const timeElapsed = (parseInt(user[0].resetPasswordTokenExpires) - Date.now()) / 1000 / 3600
    
    if (timeElapsed < 1) {
      const passwordHash = this.userService.updateUserPassword(body.userId, body.password)
      return res.status(HttpStatus.OK).json(passwordHash)
    } else {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'token expired' });
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Response() res: any, @Request() req) {
    const user = await this.userService.getUserByEmail(req.user.email);

    return res.status(HttpStatus.OK).json(user);
  }

}