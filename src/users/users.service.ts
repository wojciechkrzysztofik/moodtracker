import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { MailerService } from '@nest-modules/mailer';
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
    private saltRounds = 10;
    
    constructor(
        private readonly mailerService: MailerService,
        @InjectRepository(User)
        private usersRepository: Repository<User>) { }

    async createUser(user: User): Promise<User> {
        const activationToken: string = await this.getHash(user.email + user.password);
        user.passwordHash = await this.getHash(user.password);
        user.activationToken = activationToken;

        // clear password as we don't persist passwords
        user.password = undefined;
        return this.usersRepository.save(user);
    }

    async getUserByIdAndActivationToken(id: number, token: string): Promise<User[]> {
        return await this.usersRepository.find({
            where: [{ "id": id, "activationToken": token }]
        });
    }

    async getUserByIdAndResetPasswordToken(id: number, token: string): Promise<User[]> {
        return await this.usersRepository.find({
            where: [{ "id": id, "resetPasswordToken": token }]
        });
    }

    async getUsers(user: User): Promise<User[]> {
        return await this.usersRepository.find();
    }

    async getUserByEmail(email: string): Promise<User> {
      return (await this.usersRepository.find({ email }))[0];
    }

    async getUser(_id: number): Promise<User[]> {
        return await this.usersRepository.find({
            select: ["firstName", "lastName", "email", "address", "postCode", "city"],
            where: [{ "id": _id }]
        });
    }

    async activateUser(id: number, token: string) {
        this.usersRepository.update({
            "id": id,
            "activationToken": token
        },
        {
            'isActivated': true
        })
    }

    async resetPassword(email: string): Promise<string> {
        const token: string = await this.getHash(email)
        const tokenExpires = String(Date.now() + 3600000)

        this.usersRepository.update({
            "email": email
        },
        {
            'resetPasswordToken': token,
            'resetPasswordTokenExpires': tokenExpires
        })

        return token
    }

    async updateUserPassword(id: number, password: string): Promise<string> {
        const passwordHash = await this.getHash(password)

        this.usersRepository.update({
            'id': id
        },
        {
            'passwordHash': passwordHash,
            'resetPasswordToken': null,
            'resetPasswordTokenExpires': null
        })

        return passwordHash
    }

    async updateUser(user: User) {
        this.usersRepository.save(user)
    }

    async deleteUser(user: User) {
        this.usersRepository.delete(user);
    }

    async getHash(password: string|undefined): Promise<string> {
        return bcrypt.hash(password, this.saltRounds);
    }
  
    async compareHash(password: string|undefined, hash: string|undefined): Promise<boolean> {
      return bcrypt.compare(password, hash);
    }
}