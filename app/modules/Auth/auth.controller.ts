import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'app/decorators/get.user.decorator';
import { AuthService, LoginPayload } from '.';
import { RegisterPayload } from './register.payload';

@Controller('/api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async register(@Body() payload: RegisterPayload): Promise<object> {
    return this.authService.register(payload);
  }

  @Post('/login')
  async login(@Body() payload: LoginPayload): Promise<object> {
    return this.authService.login(payload);
  }

  @Get('/user')
  @UseGuards(AuthGuard())
  async getUser(@GetUser() user: any): Promise<any> {
    return this.authService.getUser(user._id);
  }

  @Post('/forgotpassword')
  async forgotPassword(@Body() payload: any): Promise<any> {
    return this.authService.forgotPassword(payload);
  }

  @Put('/resetpassword/:resetToken')
  async resetPassword(
    @Param('resetToken') resetToken: string,
    @Body() payload: any,
  ): Promise<any> {
    return this.authService.resetPassword(resetToken, payload);
  }
}
