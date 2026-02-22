import nodemailer from 'nodemailer';
import { config } from '../config';
import { log } from '../utils/logger';

const transporter = config.smtp.user
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.smtp.user,
        pass: config.smtp.appPassword,
      },
    })
  : null;

export async function sendInvitationEmail(invitation: {
  email: string;
  role: string;
  profession: string;
  invitedBy?: { nom: string; prenom: string } | null;
}): Promise<boolean> {
  if (!transporter) {
    log.warn('SMTP not configured — skipping invitation email', { to: invitation.email });
    return false;
  }

  const inviterName = invitation.invitedBy
    ? `${invitation.invitedBy.prenom} ${invitation.invitedBy.nom}`
    : 'Un administrateur';

  const loginUrl = `${config.frontendUrl}/login`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background-color:#f4f4f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background-color:#1e3a5f;padding:30px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;">DroitGuineen</h1>
            <p style="color:#a3bfdb;margin:8px 0 0;font-size:14px;">Portail juridique de la Republique de Guinee</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="color:#1e3a5f;margin:0 0 20px;">Vous etes invite !</h2>
            <p style="color:#333;font-size:16px;line-height:1.6;">
              <strong>${inviterName}</strong> vous invite a rejoindre la plateforme <strong>DroitGuineen</strong>.
            </p>
            <p style="color:#333;font-size:16px;line-height:1.6;">
              Vous avez ete invite en tant que <strong>${invitation.role}</strong> avec le profil <strong>${invitation.profession}</strong>.
            </p>
            <p style="color:#333;font-size:16px;line-height:1.6;">
              Cliquez sur le bouton ci-dessous pour acceder a l'application et vous connecter avec votre compte Google.
            </p>
            <!-- Button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
              <tr><td align="center">
                <a href="${loginUrl}" style="display:inline-block;background-color:#1e3a5f;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:6px;font-size:16px;font-weight:bold;">
                  Se connecter
                </a>
              </td></tr>
            </table>
            <p style="color:#666;font-size:14px;line-height:1.6;">
              Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
              <a href="${loginUrl}" style="color:#1e3a5f;">${loginUrl}</a>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background-color:#f4f4f7;padding:20px 40px;text-align:center;">
            <p style="color:#999;font-size:12px;margin:0;">
              DroitGuineen &mdash; Portail juridique de la Republique de Guinee
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"DroitGuineen" <${config.smtp.from}>`,
      to: invitation.email,
      subject: 'Vous etes invite sur DroitGuineen',
      html,
    });
    log.info('Invitation email sent', { to: invitation.email });
    return true;
  } catch (error) {
    log.warn('Failed to send invitation email', { to: invitation.email, error });
    return false;
  }
}
