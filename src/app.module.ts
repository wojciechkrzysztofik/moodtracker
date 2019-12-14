import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HandlebarsAdapter, MailerModule } from '@nest-modules/mailer';

@Module({
  imports: [
    TypeOrmModule.forRoot(),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.zenbox.pl',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'info@moodtracker.pl', // generated ethereal user
            pass: 'sharic2019!' // generated ethereal password
        }
      },
      defaults: {
        from:'"moodtracker" <info@moodtracker.pl>',
      },
      template: {
        dir: __dirname + '/templates/mail',
        adapter: new HandlebarsAdapter(), // or new PugAdapter()
        options: {
          strict: true,
        },
      },
    }),
    UsersModule,
    AuthModule
  ]
})
export class AppModule {}