import { Resend } from "resend";

const EMAIL_TEMPLATE_ID = {
  welcomeEmail: "179449ee-8e31-4116-9535-be7f1eca7245",
} as const; // better tree shaking and not widening the type to string

export default class ProductEmail {
  constructor(private emailClient: Resend) {}
  async sendVerificationEmail(
    fullName: string,
    email: string,
    url: string,
  ): Promise<void> {
    console.log(fullName, email, url);
    const { data, error } = await this.emailClient.emails.send({
      to: email,
      template: {
        id: EMAIL_TEMPLATE_ID.welcomeEmail,
        variables: {
          fullName: fullName,
          verificationURL: url,
        },
      },
    });
    console.log(error);
    //TO DO : Add error handling and logging
  }
  async sendResetPasswordEmail(
    _fullName: string,
    _email: string,
    _url: string,
  ): Promise<void> {}
}

export const emailSender = new ProductEmail(
  new Resend(process.env.RESEND_API_KEY ?? ""),
);
