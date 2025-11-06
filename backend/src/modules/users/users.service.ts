import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
  ) {}

  async findById(id: string) {
    return this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'subscription'],
    });
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({
      where: { email },
      relations: ['profile', 'subscription'],
    });
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new Error('Profile not found');
    }

    Object.assign(profile, updates);
    return this.profileRepository.save(profile);
  }
}
