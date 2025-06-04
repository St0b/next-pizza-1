import { PaymentCallbackData } from '@/@types/yookassa';
import { prisma } from '@/prisma/prisma-client';
import { OrderSuccessTemplate } from '@/shared/components/shared/email-temapltes/order-success';
import { sendEmail } from '@/shared/lib';
import { CartItemDTO } from '@/shared/services/dto/cart.dto';
import { OrderStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as PaymentCallbackData;
    console.log('Yookassa callback received:', body);

    if (!body.object.metadata?.order_id) {
      return NextResponse.json({ error: 'Order ID missing' }, { status: 400 });
    }

    const orderId = Number(body.object.metadata.order_id);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log(`Processing status: ${body.object.status} for order: ${orderId}`);

    let newStatus: OrderStatus | undefined;
    let sendSuccessEmail = false;
    let sendFailureEmail = false;

    switch (body.object.status) {
      case 'payment.succeeded':
        newStatus = OrderStatus.SUCCEEDED;
        sendSuccessEmail = true;
        break;
        
      case 'payment.waiting_for_capture': 
        newStatus = OrderStatus.PENDING;
        break;
        
      case 'payment.canceled':
        newStatus = OrderStatus.CANCELLED;
        sendFailureEmail = true;
        break;
        
      default:
        console.warn(`Unhandled status: ${body.object.status}`);
        break;
    }

    if (newStatus) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: newStatus },
      });
      console.log(`Order ${order.id} updated to status: ${newStatus}`);
    }

    let items: CartItemDTO[] = [];
    try {
      items = JSON.parse(order.items as string) as CartItemDTO[];
    } catch (e) {
      console.error('Failed to parse order items:', order.items, e);
    }

    if (sendSuccessEmail) {
      await sendEmail(
        order.email,
        'Next Pizza / Ваш заказ успешно оформлен 🎉',
        OrderSuccessTemplate({ orderId: order.id, items })
      );
      console.log(`Success email sent for order: ${order.id}`);
    } 
    else if (sendFailureEmail) {
      await sendEmail(
        order.email,
        'Next Pizza / Ваш заказ не оформлен',
        `<p>Заказ #${order.id} был отменен. Пожалуйста, попробуйте оформить заказ снова.</p>`
      );
      console.log(`Cancellation email sent for order: ${order.id}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[PAYMENT CALLBACK ERROR]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}