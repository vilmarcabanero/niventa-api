import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, RegisterPayload, LoginPayload } from '.';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { CLIENT_BASE_URL, sendEmail } from './auth.utils';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private user: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(payload: RegisterPayload): Promise<object> {
    const { email, password } = payload;
    const [username] = email.split('@');
    const found = await this.user.findOne({ email });

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    if (found) {
      throw new ConflictException('already-registered');
    }

    const user = await new this.user({
      ...payload,
      username,
      password: hashedPassword,
    }).save();

    const tokenPayload = { _id: user._id };
    const accessToken: string = this.jwtService.sign(tokenPayload);

    return {
      accessToken,
      message: 'Register successful.',
    };
  }

  async login(payload: LoginPayload): Promise<object> {
    const { email, password } = payload;

    const user = await this.user.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('not-registered');
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new UnauthorizedException('invalid-password');
    }

    const tokenPayload = { _id: user._id };
    const accessToken: string = this.jwtService.sign(tokenPayload);

    return {
      accessToken,
      message: 'Login successful.',
    };
  }

  async getUser(_id: string): Promise<User> {
    return this.user.findById(_id, { password: 0 });
  }

  async forgotPassword(payload: any): Promise<object> {
    const { email } = payload;

    const user = await this.user.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('not-registered');
    }

    const resetToken = crypto.randomBytes(20).toString('hex');

    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const resetPasswordExpire = new Date(Date.now() + 10 * (60 * 1000));

    await this.user.findOneAndUpdate(
      { email },
      { resetPasswordToken, resetPasswordExpire },
    );

    const resetUrl = `${CLIENT_BASE_URL}/resetpassword/${resetToken}`;

    const message = `
			<div style="max-width: 700px; margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
				<h2 style="text-align: center; text-transform: uppercase;color: #0b95ee;">Hello ${user.firstName},</h2>
				<p>
						Please click the button below to reset your password.
				</p>
					
				<a href=${resetUrl} style="background: #0b95ee; text-decoration: none; color: white; padding: 10px 20px; margin: 10px 0; display: inline-block; border-radius: 5px;">Reset password</a>

				<p>If the button doesn't work for any reason, you can also click on the link below:</p>

				<div>${resetUrl}</div>
			</div>
		`;

    sendEmail({
      to: email,
      subject: 'Password Reset',
      text: message,
    });

    return { message: 'Please check your email to reset your password.' };
  }

  async resetPassword(resetToken: string, payload: any): Promise<any> {
    const { password } = payload;
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await this.user.findOne({
      resetPasswordToken,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid reset token.');
    }

    if (new Date(user.resetPasswordExpire) < new Date()) {
      throw new UnauthorizedException('token-expired');
    }

    const hashedPw = bcrypt.hashSync(password, 10);

    await this.user.findOneAndUpdate(
      { resetPasswordToken },
      {
        password: hashedPw,
        resetPasswordToken: undefined,
        resetPasswordExpire: undefined,
      },
    );

    return { message: "You've successfully reset your password." };
  }
}
