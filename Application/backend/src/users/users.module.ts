import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';

/**
 * UsersModule registers the User schema with Mongoose and
 * exports UsersService so other modules (like AuthModule) can use it.
 */
@Module({
  imports: [
    // Register the User schema so it can be injected with @InjectModel(User.name)
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [UsersService],
  exports: [UsersService], // AuthModule needs access to UsersService
})
export class UsersModule {}
