/**
 * Order Notification Service
 * 
 * Delivers instant order alerts to store owner's phone (+91 8155979744).
 * Supports:
 * 1. Twilio WhatsApp (Official Meta partner, 100% reliable instant free tier)
 * 2. Meta WhatsApp Cloud API (Free official Meta developer tier)
 * 3. CallMeBot WhatsApp (Free personal API)
 * 4. Telegram Bot (Free instant push alerts)
 * 5. Discord Webhook
 */

export interface OrderNotificationPayload {
  orderId: string;
  total: number;
  paymentMethod: 'cod' | 'razorpay';
  shipping: {
    name: string;
    phone: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    name: string;
    size: string;
    quantity: number;
  }>;
}

export async function notifyAdminNewOrder(payload: OrderNotificationPayload): Promise<void> {
  const adminPhone = process.env.ADMIN_PHONE_NUMBER || '918155979744';
  const cleanPhone = adminPhone.replace(/[^0-9]/g, '');

  const itemsSummary = payload.items
    .map((item) => `• ${item.name} (${item.size}) x${item.quantity}`)
    .join('\n');

  const textMessage = 
`🛍️ *NEW ARVIIK ORDER!*
━━━━━━━━━━━━━━━━━━
*Order ID:* ${payload.orderId}
*Total:* ₹${payload.total.toLocaleString('en-IN')} (${payload.paymentMethod.toUpperCase()})
*Customer:* ${payload.shipping.name}
*Phone:* ${payload.shipping.phone}
*City:* ${payload.shipping.city}, ${payload.shipping.state} (${payload.shipping.pincode})

*Items:*
${itemsSummary}
━━━━━━━━━━━━━━━━━━`;

  console.log(`\n==================================================`);
  console.log(`🔔 NEW ORDER NOTIFICATION [${payload.orderId}]`);
  console.log(`Target Phone: +${cleanPhone}`);
  console.log(textMessage);
  console.log(`==================================================\n`);

  // 1. Official Twilio WhatsApp Sandbox (Free & Instant)
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  if (twilioSid && twilioToken) {
    try {
      const sender = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
      const recipient = `whatsapp:+${cleanPhone}`;
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const basicAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');

      const res = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: sender,
          To: recipient,
          Body: textMessage,
        }),
      });

      if (res.ok) {
        console.log(`✓ Twilio WhatsApp alert delivered to ${recipient}`);
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.error('Twilio WhatsApp error:', errJson);
      }
    } catch (err) {
      console.error('Failed to send Twilio WhatsApp notification:', err);
    }
  }

  // 2. Meta WhatsApp Cloud API (Free 1,000 conversations/month)
  const metaToken = process.env.META_WA_TOKEN;
  const metaPhoneId = process.env.META_WA_PHONE_ID;
  if (metaToken && metaPhoneId) {
    try {
      const metaUrl = `https://graph.facebook.com/v20.0/${metaPhoneId}/messages`;
      const res = await fetch(metaUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: textMessage },
        }),
      });

      if (res.ok) {
        console.log(`✓ Meta WhatsApp Cloud alert delivered to ${cleanPhone}`);
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.error('Meta WhatsApp Cloud API error:', errJson);
      }
    } catch (err) {
      console.error('Failed to send Meta WhatsApp alert:', err);
    }
  }

  // 3. Green API (WhatsApp Web Protocol - 100% Free Forever Developer Plan)
  const greenId = process.env.GREEN_API_ID_INSTANCE;
  const greenToken = process.env.GREEN_API_API_TOKEN_INSTANCE;
  const greenApiUrl = process.env.GREEN_API_URL || 'https://7107.api.greenapi.com';
  if (greenId && greenToken) {
    try {
      const url = `${greenApiUrl}/waInstance${greenId}/sendMessage/${greenToken}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: `${cleanPhone}@c.us`,
          message: textMessage,
        }),
      });

      if (res.ok) {
        console.log(`✓ Green API WhatsApp alert delivered to ${cleanPhone}`);
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.error('Green API error:', errJson);
      }
    } catch (err) {
      console.error('Failed to send Green API notification:', err);
    }
  }

  // 4. CallMeBot WhatsApp (Free Community API)
  const callMeBotKey = process.env.CALLMEBOT_API_KEY;
  if (callMeBotKey) {
    try {
      const encodedText = encodeURIComponent(textMessage);
      const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedText}&apikey=${callMeBotKey}`;

      const res = await fetch(url, { method: 'GET' });
      if (res.ok) {
        console.log(`✓ CallMeBot WhatsApp notification sent to ${cleanPhone}`);
      }
    } catch (err) {
      console.error('CallMeBot notification failed:', err);
    }
  }

  // 4. Telegram Bot (Free Backup)
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  if (telegramBotToken && telegramChatId) {
    try {
      const telegramUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
      await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: textMessage,
          parse_mode: 'Markdown',
        }),
      });
    } catch (err) {
      console.error('Telegram alert failed:', err);
    }
  }

  // 5. Discord Webhook (Rich Embed Instant Alert)
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (discordWebhookUrl) {
    try {
      const embedPayload = {
        username: 'ARVIIK Order Bot',
        avatar_url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=200&q=80',
        embeds: [
          {
            title: `🛍️ New Order: ${payload.orderId}`,
            color: payload.paymentMethod === 'cod' ? 0xeab308 : 0x22c55e, // Yellow for COD, Green for Prepaid
            fields: [
              {
                name: '💰 Total Amount',
                value: `**₹${payload.total.toLocaleString('en-IN')}** (${payload.paymentMethod.toUpperCase()})`,
                inline: true,
              },
              {
                name: '👤 Customer',
                value: `${payload.shipping.name}\n📞 \`${payload.shipping.phone}\``,
                inline: true,
              },
              {
                name: '📍 Delivery Location',
                value: `${payload.shipping.city}, ${payload.shipping.state} (${payload.shipping.pincode})`,
                inline: false,
              },
              {
                name: '📦 Ordered Items',
                value: itemsSummary,
                inline: false,
              },
            ],
            footer: {
              text: 'ARVIIK Streetwear Store Notification',
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const res = await fetch(discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(embedPayload),
      });

      if (res.ok) {
        console.log('✓ Discord rich embed alert sent successfully');
      } else {
        const errText = await res.text();
        console.error('Discord webhook error:', errText);
      }
    } catch (err) {
      console.error('Discord alert failed:', err);
    }
  }
}
