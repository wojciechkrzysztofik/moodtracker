import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ length: 100, nullable: true })
    password: string|undefined
  
    @Column({ length: 100, nullable: true })
    passwordHash: string|undefined

    @Column({ length: 150, unique: true })
    email: string

    @Column({ length: 20 })
    firstName: string

    @Column({ length: 50 })
    lastName: string

    @Column({ length: 100 })
    address: string

    @Column({ length: 6 })
    postCode: string

    @Column({ length: 40 })
    city: string

    @Column({ length: 100, nullable: true })
    resetPasswordToken: string|undefined

    @Column({ nullable: true })
    resetPasswordTokenExpires: string|undefined
  
    @Column({ length: 100, nullable: true })
    activationToken: string|undefined

    @Column()
    isActivated: boolean
}