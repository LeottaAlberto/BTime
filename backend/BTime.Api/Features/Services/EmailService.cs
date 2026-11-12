using MailKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace BTime.Api.Features.Services;

public class EmailService(IConfiguration config, ILogger<EmailService> logger)
{
    private readonly IConfiguration _config = config;
    private readonly ILogger<EmailService> _logger = logger;

    private string Host => _config["Smtp:Host"] ?? "smtp-relay.brevo.com";
    private int Port => int.TryParse(_config["Smtp:Port"], out var p) ? p : 587;
    private string SenderName => _config["Smtp:SenderName"] ?? "BTime";
    private string SenderEmail => _config["Smtp:SenderEmail"] ?? "no-reply@btime.home";
    private string Username => _config["Smtp:Username"] ?? string.Empty;
    private string Password => _config["Smtp:Password"] ?? string.Empty;
    private bool EnableSsl => bool.TryParse(_config["Smtp:EnableSsl"], out var ssl) ? ssl : true;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Username) && !string.IsNullOrWhiteSpace(Password);

    public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlContent, string textContent)
    {
        if (string.IsNullOrWhiteSpace(toEmail))
        {
            _logger.LogWarning("[EmailService] Indirizzo email destinatario vuoto. Invio annullato.");
            return false;
        }

        if (!IsConfigured)
        {
            _logger.LogWarning(
                "[EmailService] Brevo / SMTP non configurato in appsettings.json. [MODALITÀ SIMULAZIONE]\n" +
                "  Destinatario: {To}\n" +
                "  Oggetto: {Subject}\n" +
                "  Testo:\n{Body}",
                toEmail, subject, textContent);
            return true;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(SenderName, SenderEmail));
            message.To.Add(new MailboxAddress(toEmail, toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = htmlContent,
                TextBody = textContent
            };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            client.Timeout = 15000; // 15 secondi timeout

            var secureSocketOption = Port == 465
                ? SecureSocketOptions.SslOnConnect
                : SecureSocketOptions.StartTls;

            await client.ConnectAsync(Host, Port, secureSocketOption);
            await client.AuthenticateAsync(Username, Password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("[EmailService] Email inviata con successo a {To} (Oggetto: {Subject})", toEmail, subject);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[EmailService] Errore durante l'invio dell'email a {To}: {Message}", toEmail, ex.Message);
            return false;
        }
    }

    /// <summary>
    /// Invia un avviso di sicurezza quando viene sbloccata con successo la sezione dati sensibili
    /// </summary>
    public async Task<bool> SendSecurityAlertEmailAsync(string toEmail, string username, string? clientIp)
    {
        var subject = "⚠️ [BTime] Avviso di sicurezza: Accesso alle impostazioni riservate";
        var dateFormatted = DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm");
        var ipInfo = string.IsNullOrWhiteSpace(clientIp) ? "Non disponibile" : clientIp;

        var html = BuildModernTemplate(
            title: "Avviso di Sicurezza",
            badgeText: "Accesso Rilevato",
            badgeColor: "#f59e0b",
            contentHtml: $"""
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #e4e4e7; line-height: 1.6;">
                    Ciao <strong>{System.Net.WebUtility.HtmlEncode(username)}</strong>,
                </p>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #a1a1aa; line-height: 1.6;">
                    Ti informiamo che in data <strong>{dateFormatted} UTC</strong> è stato effettuato l'accesso con verifica della password attuale alle <strong style="color: #f59e0b;">impostazioni riservate</strong> del tuo account BTime.
                </p>
                <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 14px 18px; margin: 20px 0;">
                    <div style="font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Dettagli evento</div>
                    <div style="font-size: 13px; color: #f4f4f5; margin-bottom: 4px;"><strong>Azione:</strong> Sblocco impostazioni sensibili</div>
                    <div style="font-size: 13px; color: #f4f4f5;"><strong>Indirizzo IP:</strong> <code style="color: #a78bfa; font-family: monospace;">{ipInfo}</code></div>
                </div>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
                    Se sei stato tu a compiere questa operazione, puoi tranquillamente ignorare questa notifica.
                </p>
                <p style="margin: 0; font-size: 13px; color: #ef4444; line-height: 1.5;">
                    Se <strong>non riconosci</strong> questa attività, ti consigliamo di cambiare immediatamente la password e verificare i tuoi dispositivi attivi.
                </p>
            """
        );

        var text =
            $"Ciao {username},\n\n" +
            $"Abbiamo rilevato uno sblocco delle impostazioni di sicurezza del tuo account BTime in data {dateFormatted} UTC (IP: {ipInfo}).\n\n" +
            "Se sei stato tu puoi ignorare questo avviso. In caso contrario, cambia immediatamente la tua password.";

        return await SendEmailAsync(toEmail, subject, html, text);
    }

    /// <summary>
    /// Invia un codice OTP di verifica prima di confermare la modifica di password o email
    /// </summary>
    public async Task<bool> SendOtpEmailAsync(string toEmail, string username, string otpCode, string changeType)
    {
        var subject = $"🔐 [BTime] Codice di verifica per modifica {changeType}";

        var html = BuildModernTemplate(
            title: "Verifica Identità",
            badgeText: "Conferma Richiesta",
            badgeColor: "#8b5cf6",
            contentHtml: $"""
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #e4e4e7; line-height: 1.6;">
                    Ciao <strong>{System.Net.WebUtility.HtmlEncode(username)}</strong>,
                </p>
                <p style="margin: 0 0 20px 0; font-size: 14px; color: #a1a1aa; line-height: 1.6;">
                    Hai richiesto di modificare <strong style="color: #c4b5fd;">{System.Net.WebUtility.HtmlEncode(changeType)}</strong> sul tuo account BTime. Inserisci il seguente codice di sicurezza per confermare l'operazione:
                </p>
                <div style="text-align: center; margin: 28px 0;">
                    <div style="display: inline-block; background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.05)); border: 2px dashed #8b5cf6; border-radius: 16px; padding: 18px 36px;">
                        <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #ffffff; text-shadow: 0 0 12px rgba(139, 92, 246, 0.6);">
                            {otpCode}
                        </span>
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; color: #a1a1aa;">
                        Il codice scade tra <strong>10 minuti</strong>.
                    </div>
                </div>
                <div style="background-color: #18181b; border-left: 3px solid #8b5cf6; border-radius: 6px; padding: 12px 16px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 12px; color: #71717a; line-height: 1.5;">
                        <strong style="color: #e4e4e7;">Nota di sicurezza:</strong> Nessun membro del team BTime ti chiederà mai questo codice. Non inoltrarlo o condividerlo con nessuno. Se non hai richiesto questa modifica, ignora questa email: il tuo account rimarrà invariato.
                    </p>
                </div>
            """
        );

        var text =
            $"Ciao {username},\n\n" +
            $"Hai richiesto di modificare {changeType} sul tuo account BTime.\n\n" +
            $"Il tuo codice di verifica è: {otpCode}\n\n" +
            "Il codice è valido per 10 minuti. Non condividerlo con nessuno.\n" +
            "Se non sei stato tu a richiedere questa modifica, ignora questa email.";

        return await SendEmailAsync(toEmail, subject, html, text);
    }

    /// <summary>
    /// Notifica l'utente che le modifiche ai dati sensibili sono state applicate con successo
    /// </summary>
    public async Task<bool> SendSecurityChangeConfirmedEmailAsync(string toEmail, string username, string changeDetails)
    {
        var subject = "✅ [BTime] Impostazioni di sicurezza aggiornate con successo";
        var dateFormatted = DateTime.UtcNow.ToString("dd/MM/yyyy HH:mm");

        var html = BuildModernTemplate(
            title: "Modifiche Applicate",
            badgeText: "Confermato",
            badgeColor: "#10b981",
            contentHtml: $"""
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #e4e4e7; line-height: 1.6;">
                    Ciao <strong>{System.Net.WebUtility.HtmlEncode(username)}</strong>,
                </p>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #a1a1aa; line-height: 1.6;">
                    Ti confermiamo che in data <strong>{dateFormatted} UTC</strong> le seguenti informazioni di sicurezza del tuo account BTime sono state aggiornate con successo:
                </p>
                <div style="background-color: #18181b; border: 1px solid #10b981; border-radius: 12px; padding: 14px 18px; margin: 20px 0;">
                    <div style="font-size: 14px; color: #34d399; font-weight: 600;">
                        ✔ {System.Net.WebUtility.HtmlEncode(changeDetails)}
                    </div>
                </div>
                <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
                    Se non hai effettuato tu questa operazione, ti invitiamo a contattare immediatamente l'amministratore del sistema.
                </p>
            """
        );

        var text =
            $"Ciao {username},\n\n" +
            $"Ti confermiamo che le informazioni di sicurezza del tuo account BTime sono state aggiornate con successo: {changeDetails}.\n" +
            $"Data: {dateFormatted} UTC.\n\n" +
            "Se non sei stato tu, contatta subito l'amministratore.";

        return await SendEmailAsync(toEmail, subject, html, text);
    }

    private static string BuildModernTemplate(string title, string badgeText, string badgeColor, string contentHtml)
    {
        return $"""
        <!DOCTYPE html>
        <html lang="it">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{title}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 32px 16px;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" style="max-width: 540px; background-color: #121217; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);" cellspacing="0" cellpadding="0">
                            <!-- Header Brand -->
                            <tr>
                                <td style="padding: 28px 32px; background: linear-gradient(180deg, rgba(139, 92, 246, 0.12) 0%, rgba(18, 18, 23, 0) 100%); border-bottom: 1px solid #27272a;">
                                    <table width="100%" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td>
                                                <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                                                    B<span style="color: #8b5cf6;">Time</span>
                                                </div>
                                                <div style="font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px;">
                                                    Security Center
                                                </div>
                                            </td>
                                            <td align="right">
                                                <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background-color: {badgeColor}22; color: {badgeColor}; border: 1px solid {badgeColor}44;">
                                                    {badgeText}
                                                </span>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <!-- Body -->
                            <tr>
                                <td style="padding: 32px;">
                                    {contentHtml}
                                </td>
                            </tr>
                            <!-- Footer -->
                            <tr>
                                <td style="padding: 20px 32px; background-color: #0d0d11; border-top: 1px solid #1f1f23; text-align: center;">
                                    <p style="margin: 0 0 6px 0; font-size: 11px; color: #52525b;">
                                        Questa è un'email automatica generata dal server BTime. Non rispondere a questo messaggio.
                                    </p>
                                    <p style="margin: 0; font-size: 11px; color: #3f3f46;">
                                        &copy; {DateTime.UtcNow.Year} BTime Media Server. Tutti i diritti riservati.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """;
    }
}
