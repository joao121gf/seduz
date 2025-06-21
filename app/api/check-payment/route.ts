import { type NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get("payment_id")

    if (!paymentId) {
      return NextResponse.json({ success: false, error: "payment_id é obrigatório" }, { status: 400 })
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Access token não configurado" }, { status: 500 })
    }

    // Configurar Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: accessToken,
    })

    const payment = new Payment(client)

    // Buscar informações do pagamento
    const paymentInfo = await payment.get({ id: paymentId })

    console.log(`🔍 Verificando pagamento ${paymentId}:`, paymentInfo.status)

    return NextResponse.json({
      success: true,
      payment_id: paymentInfo.id,
      status: paymentInfo.status,
      status_detail: paymentInfo.status_detail,
      external_reference: paymentInfo.external_reference,
      transaction_amount: paymentInfo.transaction_amount,
      date_approved: paymentInfo.date_approved,
      is_approved: paymentInfo.status === "approved",
    })
  } catch (error: any) {
    console.error("❌ Erro ao verificar pagamento:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao verificar pagamento",
      },
      { status: 500 },
    )
  }
}
