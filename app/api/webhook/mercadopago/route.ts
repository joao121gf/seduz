import { type NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
})

const payment = new Payment(client)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verificar se é uma notificação de pagamento
    if (body.type === "payment") {
      const paymentId = body.data.id

      // Buscar detalhes do pagamento
      const paymentInfo = await payment.get({ id: paymentId })

      if (paymentInfo.status === "approved") {
        // Pagamento aprovado!
        const pedidoId = paymentInfo.external_reference

        // Aqui você pode:
        // 1. Atualizar status do pedido no seu sistema
        // 2. Enviar email de confirmação
        // 3. Enviar WhatsApp

        console.log(`Pagamento aprovado para pedido: ${pedidoId}`)

        // Exemplo: enviar email de confirmação
        // await enviarEmailConfirmacao(pedidoId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Erro no webhook:", error)
    return NextResponse.json({ error: "Erro no webhook" }, { status: 500 })
  }
}
