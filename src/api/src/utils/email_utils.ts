export default class ProductEmail {
  static async sendVerificationEmail(
    email: string,
    url: string,
    token: string,
  ): Promise<void> {
    console.log(
      `Sending verification email to ${email} with URL: ${url} and token: ${token}`,
    );
  }
}
