import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, name, orderId, total } = await request.json();

    // In a real-world project, we would use nodemailer or a service like Resend/SendGrid.
    // Here we simulate and log the email transmission to standard console.
    console.log('\n==================================================');
    console.log('📬 SIMULATED CONFIRMATION EMAIL');
    console.log(`To: ${email} (${name})`);
    console.log(`Subject: Your ARVIIK Order Confirmation [${orderId}]`);
    console.log('--------------------------------------------------');
    console.log(`Hello ${name},`);
    console.log(`We have successfully received your payment of INR ${total}.`);
    console.log(`Your order ${orderId} is being prepared in our warehouse.`);
    console.log('Thank you for wearing your identity.');
    console.log('Team ARVIIK.');
    console.log('==================================================\n');

    return NextResponse.json({ message: 'Email mock sent successfully' });
  } catch (err: any) {
    console.error('Error sending mock email:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
