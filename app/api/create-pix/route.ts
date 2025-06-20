import { type NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  console.log("🔥 API create-pix chamada!")

  try {
    // Verificar se as variáveis de ambiente estão disponíveis
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    console.log("🔑 Access Token disponível:", !!accessToken)

    if (!accessToken) {
      console.error("❌ MERCADO_PAGO_ACCESS_TOKEN não encontrado!")
      return NextResponse.json(
        {
          success: false,
          error: "Access token não configurado",
          details: "Variável MERCADO_PAGO_ACCESS_TOKEN não encontrada",
        },
        { status: 500 },
      )
    }

    // Configurar Mercado Pago
    console.log("⚙️ Configurando Mercado Pago...")
    const client = new MercadoPagoConfig({
      accessToken: accessToken,
      options: {
        timeout: 10000,
      },
    })

    const payment = new Payment(client)
    console.log("✅ Cliente Mercado Pago configurado")

    // Ler dados da requisição
    console.log("📖 Lendo dados da requisição...")
    const body = await request.json()
    console.log("📦 Dados recebidos:", body)

    const { amount, description, email, pedidoId } = body

    // Validar dados obrigatórios
    if (!amount || !description || !email || !pedidoId) {
      console.error("❌ Dados obrigatórios faltando:", { amount, description, email, pedidoId })
      return NextResponse.json(
        {
          success: false,
          error: "Dados obrigatórios faltando",
          details: { amount: !!amount, description: !!description, email: !!email, pedidoId: !!pedidoId },
        },
        { status: 400 },
      )
    }

    // Converter preço para número
    console.log("💰 Convertendo valor:", amount)
    const amountNumber = Number.parseFloat(amount.replace("R$ ", "").replace(",", "."))
    console.log("💰 Valor convertido:", amountNumber)

    if (isNaN(amountNumber) || amountNumber <= 0) {
      console.error("❌ Valor inválido:", amountNumber)
      return NextResponse.json(
        {
          success: false,
          error: "Valor inválido",
          details: `Não foi possível converter '${amount}' para número`,
        },
        { status: 400 },
      )
    }

    // Criar dados do pagamento
    const paymentData = {
      transaction_amount: amountNumber,
      description: description,
      payment_method_id: "pix",
      payer: {
        email: email,
      },
      external_reference: pedidoId,
    }

    console.log("📋 Dados do pagamento:", paymentData)

    // Criar pagamento
    console.log("🚀 Criando pagamento no Mercado Pago...")
    const result = await payment.create({ body: paymentData })
    console.log("✅ Pagamento criado com sucesso!")

    // Verificar se o QR Code foi gerado
    const qrCode = result.point_of_interaction?.transaction_data?.qr_code
    const qrCodeBase64 = result.point_of_interaction?.transaction_data?.qr_code_base64
    const ticketUrl = result.point_of_interaction?.transaction_data?.ticket_url

    console.log("🔍 QR Code disponível:", !!qrCode)
    console.log("🔍 QR Code Base64 disponível:", !!qrCodeBase64)
    console.log("🔍 Ticket URL disponível:", !!ticketUrl)

    return NextResponse.json({
      success: true,
      payment_id: result.id,
      status: result.status,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      ticket_url: ticketUrl,
      debug: {
        transaction_amount: amountNumber,
        description: description,
        external_reference: pedidoId,
        payment_method_id: "pix",
      },
    })
  } catch (error: any) {
    console.error("❌ Erro detalhado na API:", error)
    console.error("❌ Erro name:", error?.name)
    console.error("❌ Erro message:", error?.message)
    console.error("❌ Erro response:", error?.response?.data)
    console.error("❌ Erro status:", error?.response?.status)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro desconhecido ao gerar PIX",
        details: {
          name: error?.name,
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
        },
      },
      { status: 500 },
    )
  }
}
