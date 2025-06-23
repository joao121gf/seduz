"use client"

import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Star,
  Users,
  Award,
  Shield,
  Headphones,
  Truck,
  CreditCard,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
} from "lucide-react"
import emailjs from "@emailjs/browser"

export default function Component() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const [showFormModal, setShowFormModal] = useState(false)
  const [showPixModal, setShowPixModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderData, setOrderData] = useState({
    nome: "",
    email: "",
    cpf: "",
    cep: "",
    estado: "",
    cidade: "",
    numeroCasa: "",
    whatsapp: "",
  })
  const [pixData, setPixData] = useState({
    qr_code: "",
    qr_code_base64: "",
    payment_id: "",
  })

  const [isPolling, setIsPolling] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [submitMessage, setSubmitMessage] = useState<string>("")
  const [emailSent, setEmailSent] = useState(false)

  // Ref para scroll suave
  const produtosRef = useRef<HTMLElement>(null)

  // Inicializar EmailJS
  useEffect(() => {
    emailjs.init("hIUp4sWfNrscBt-he") // Public Key
  }, [])

  // Função de scroll otimizada
  const scrollToProdutos = useCallback(() => {
    produtosRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const openProductModal = useCallback((product: any) => {
    // Resetar todos os outros modais primeiro
    setShowFormModal(false)
    setShowPixModal(false)
    setIsPolling(false)
    setPaymentStatus(null)
    setSubmitMessage("")
    setEmailSent(false)

    // Depois abrir o modal do produto
    setSelectedProduct(product)
    setIsModalOpen(true)
    setTimeout(() => setIsAnimating(true), 10)
  }, [])

  const closeProductModal = useCallback(() => {
    setIsAnimating(false)
    setTimeout(() => {
      setIsModalOpen(false)
      setSelectedProduct(null)
    }, 300)
  }, [])

  const openFormModal = useCallback(() => {
    // Fechar modal do produto imediatamente sem setTimeout
    setIsAnimating(false)
    setIsModalOpen(false)

    // Abrir formulário imediatamente
    setShowFormModal(true)
    setSubmitMessage("")
    setEmailSent(false)
  }, [])

  const closeFormModal = useCallback(() => {
    setShowFormModal(false)
    setSubmitMessage("")
    setEmailSent(false)
    setOrderData({
      nome: "",
      email: "",
      cpf: "",
      cep: "",
      estado: "",
      cidade: "",
      numeroCasa: "",
      whatsapp: "",
    })
  }, [])

  const closePixModal = useCallback(() => {
    setShowPixModal(false)
    setIsPolling(false)
    setPaymentStatus(null)
    setPixData({
      qr_code: "",
      qr_code_base64: "",
      payment_id: "",
    })
  }, [])

  const toggleFaq = useCallback(
    (index: number) => {
      setOpenFaq(openFaq === index ? null : index)
    },
    [openFaq],
  )

  // Função para verificar status do pagamento
  const checkPaymentStatus = useCallback(async (paymentId: string) => {
    try {
      const response = await fetch(`/api/check-payment?payment_id=${paymentId}`)
      const result = await response.json()

      if (result.success) {
        console.log("📊 Status do pagamento:", result.status)

        if (result.is_approved) {
          setPaymentStatus("approved")
          setIsPolling(false)
          // Não fechar o modal automaticamente, deixar o usuário ver a confirmação
          return true
        } else if (result.status === "cancelled" || result.status === "rejected") {
          setPaymentStatus(result.status)
          setIsPolling(false)
          return true
        }
      }
      return false
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error)
      return false
    }
  }, [])

  // Função para iniciar polling
  const startPolling = useCallback(
    (paymentId: string) => {
      setIsPolling(true)
      setPaymentStatus("pending")

      const pollInterval = setInterval(async () => {
        const finished = await checkPaymentStatus(paymentId)
        if (finished) {
          clearInterval(pollInterval)
        }
      }, 3000) // Verifica a cada 3 segundos

      // Para o polling após 10 minutos (PIX expira)
      setTimeout(() => {
        clearInterval(pollInterval)
        setIsPolling(false)
        if (paymentStatus === "pending") {
          setPaymentStatus("expired")
        }
      }, 600000) // 10 minutos
    },
    [checkPaymentStatus, paymentStatus],
  )

  // Função para enviar email via EmailJS
  const sendEmailNotification = useCallback(async (orderDetails: any) => {
    try {
      console.log("📧 Enviando email com EmailJS...")

      const templateParams = {
        pedido_id: orderDetails.pedidoId,
        produto_nome: orderDetails.produto,
        produto_preco: orderDetails.preco,
        cliente_nome: orderDetails.nome,
        cliente_whatsapp: orderDetails.whatsapp,
        cliente_cep: orderDetails.cep,
        cliente_estado: orderDetails.estado,
        cliente_cidade: orderDetails.cidade,
        cliente_numero: orderDetails.numeroCasa,
        data_pedido: new Date().toLocaleString("pt-BR"),
      }

      console.log("📋 Template params:", templateParams)

      const result = await emailjs.send(
        "service_f9wg6sr", // Service ID
        "template_4ndjjvh", // Template ID
        templateParams,
      )

      console.log("✅ Email enviado com sucesso!", result)
      setEmailSent(true)
      return true
    } catch (error) {
      console.error("❌ Erro ao enviar email:", error)
      return false
    }
  }, [])

  const handleRealizarPedido = useCallback(async () => {
    console.log("🚀 Iniciando pedido...")

    if (!selectedProduct) {
      setSubmitMessage("❌ Erro: Produto não encontrado. Tente novamente.")
      return
    }

    setIsSubmitting(true)
    setSubmitMessage("💳 Gerando PIX...")

    try {
      const pedidoId = `PED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Preparar dados para o email ANTES de gerar o PIX
      const orderDetails = {
        nome: orderData.nome,
        email: orderData.email,
        whatsapp: orderData.whatsapp,
        cpf: orderData.cpf,
        cep: orderData.cep,
        cidade: orderData.cidade,
        estado: orderData.estado,
        produto: selectedProduct.name,
        preco: selectedProduct.price,
        pedidoId: pedidoId,
        paymentId: null, // Será preenchido depois
      }

      // 1. PRIMEIRO: Enviar email de notificação
      await sendEmailNotification(orderDetails)

      // 2. SEGUNDO: Gerar PIX
      setSubmitMessage("💳 Gerando PIX...")

      // Extrair apenas o valor numérico do preço
      const priceString = selectedProduct.price.replace("R$ ", "").replace(",", ".")
      const priceValue = Number.parseFloat(priceString)

      const pixPayload = {
        amount: priceValue,
        description: `SEDUZ - ${selectedProduct.name}`,
        email: orderData.email,
        pedidoId: pedidoId,
      }

      console.log("PIX Payload:", pixPayload)

      const pixResponse = await fetch("/api/create-pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pixPayload),
      })

      if (!pixResponse.ok) {
        throw new Error(`HTTP error! status: ${pixResponse.status}`)
      }

      const pixResult = await pixResponse.json()

      if (pixResult.success && pixResult.payment_id) {
        setPixData({
          qr_code: pixResult.qr_code,
          qr_code_base64: pixResult.qr_code_base64,
          payment_id: pixResult.payment_id,
        })

        closeFormModal()
        setShowPixModal(true)

        // Iniciar polling para verificar pagamento
        startPolling(pixResult.payment_id)

        setSubmitMessage("✅ Pedido criado com sucesso! PIX gerado.")
      } else {
        throw new Error(pixResult.error || "Erro desconhecido na API")
      }
    } catch (error) {
      console.error("❌ Erro:", error)
      setSubmitMessage(`❌ Erro ao realizar pedido: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedProduct, orderData, closeFormModal, startPolling, sendEmailNotification])

  // Validação de email otimizada
  const isValidEmail = useCallback((email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }, [])

  // Verificar se formulário está válido
  const isFormValid = useMemo(() => {
    return (
      orderData.nome &&
      orderData.email &&
      isValidEmail(orderData.email) &&
      orderData.cpf &&
      orderData.cep &&
      orderData.estado &&
      orderData.cidade &&
      orderData.numeroCasa &&
      orderData.whatsapp
    )
  }, [orderData, isValidEmail])

  // Produtos memoizados
  const products = useMemo(
    () => [
      {
        id: 1,
        name: "Noite Sublime",
        price: "R$ 0,10",
        rating: 4.9,
        reviews: 527,
        image: "/1.jpg?height=300&width=400",
        description:
          "Kit Sensações Intensas – Aproveite o combo especial com lubrificantes beijáveis, plug de aço com cristal e spray dessensibilizante para experiências mais ousadas e prazerosas.",
        features: [
          "Devorous Bubbalove Spray",
          "D4 Lubrificante Íntimo Beijável",
          "Plug Anal de Aço Inoxidável com Cristal",
          "LubPro Lubrificante sabor Morango",
        ],
      },
      {
        id: 2,
        name: "Mark Prótese Curvada",
        price: "R$ 62,90",
        rating: 4.8,
        reviews: 889,
        image: "/1pb2.jpg?height=300&width=400",
        description:
          "A prótese realística é ideal para quem deseja explorar novas sensações e aproveitar cada momento com mais intensidade durante a penetração.",
        features: ["Toque macio", "Firme e flexível", "Prazer inesquecível", "Penetrações intensas"],
      },
      {
        id: 3,
        name: "Conjunto Emily Sem Bojo",
        price: "R$ 47,90",
        rating: 4.7,
        reviews: 756,
        image: "/lange2.jpg?height=300&width=400",
        description: "A lingerie Emily é composta por peças que te deixarão ainda mais sexy e ousada.",
        features: [
          "Acompanha cinta liga",
          "Ideal para momentos especiais",
          "Confeccionado em renda delicada",
          "Sensualidade marcante",
        ],
      },
    ],
    [],
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-red-950/20 to-black">
        <div className="fundor absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80"></div>
        <div className="relative text-center space-y-6 z-10">
          <h1 className="text-4xl md:text-6xl font-bold tracking-wider text-red-500 drop-shadow-2xl">SEDUZ</h1>
          <p className="text-xl md:text-2xl text-gray-300 font-light">Desperte seus sentidos com elegância</p>
          <Button
            onClick={scrollToProdutos}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg shadow-red-500/25"
          >
            Explorar produtos
          </Button>
        </div>
      </section>

      {/* Red Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

      {/* Statistics Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-black via-red-950/10 to-black relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-red-950/5 to-black"></div>
        <div className="container mx-auto px-3 md:px-4 max-w-6xl relative z-10">
          <div className="text-center mb-6 md:mb-12">
            <h2 className="text-xl md:text-4xl font-bold text-red-500 mb-4 drop-shadow-lg">
              Mais de 10 Anos de Excelência
            </h2>
            <p className="text-gray-400 max-w-3xl mx-auto">
              A SEDUZ tem se destacado no mercado brasileiro oferecendo produtos e serviços de alta qualidade,
              conquistando a confiança de milhares de clientes em todo o país.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-red-500 mb-2 drop-shadow-lg">500+</div>
              <div className="text-gray-400">Clientes Satisfeitos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-red-500 mb-2 drop-shadow-lg">98%</div>
              <div className="text-gray-400">Taxa de Satisfação</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-red-500 mb-2 drop-shadow-lg">24h</div>
              <div className="text-gray-400">Suporte Disponível</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-5xl font-bold text-red-500 mb-2 drop-shadow-lg">10+</div>
              <div className="text-gray-400">Anos de Experiência</div>
            </div>
          </div>
        </div>
      </section>

      {/* Red Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

      {/* Categories Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-black via-red-950/5 to-black relative">
        <div className="absolute inset-0 bg-gradient-to-l from-black via-red-950/10 to-black"></div>
        <div className="container mx-auto px-3 md:px-4 max-w-6xl relative z-10">
          <h2 className="text-xl md:text-4xl font-bold text-center text-red-500 mb-6 md:mb-12 drop-shadow-lg">
            Explore Nossas Categorias
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { name: "Lingserie", image: "/lange-ogr.jpg?height=200&width=300" },
              { name: "Acessórios", image: "/aces.jpg?height=200&width=300" },
              { name: "Cosméticos", image: "/cosmetics.jpg?height=200&width=300" },
              { name: "Brinquedos", image: "/acss.jpg?height=200&width=300" },
            ].map((category, index) => (
              <Card
                key={index}
                className="bg-gradient-to-br from-gray-900 to-black border-gray-800 hover:border-red-500 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 overflow-hidden cursor-pointer"
              >
                <div className="h-28 md:h-40 relative overflow-hidden">
                  <img
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-lg md:text-xl font-semibold text-white drop-shadow-lg">{category.name}</h3>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Red Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

      {/* Why Choose Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-black via-red-950/10 to-black relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-red-950/5 to-black"></div>
        <div className="container mx-auto px-3 md:px-4 max-w-6xl relative z-10">
          <h2 className="text-xl md:text-4xl font-bold text-center text-red-500 mb-6 md:mb-12 drop-shadow-lg">
            Por Que Escolher a SEDUZ?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: Users, title: "Comunidade Exclusiva", desc: "Faça parte de uma comunidade seleta e exclusiva" },
              { icon: Shield, title: "Segurança Total", desc: "Seus dados e privacidade são nossa prioridade" },
              { icon: Award, title: "Qualidade Premium", desc: "Produtos e serviços de altíssima qualidade" },
              { icon: Headphones, title: "Atendimento Especializado", desc: "Suporte personalizado 24/7" },
              { icon: Truck, title: "Entrega Discreta", desc: "Entrega rápida e totalmente discreta" },
              { icon: CreditCard, title: "Pagamento Seguro", desc: "Múltiplas formas de pagamento seguras" },
            ].map((item, index) => (
              <Card
                key={index}
                className="bg-gradient-to-br from-black to-gray-900 border-gray-800 hover:border-red-500 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
              >
                <CardContent className="p-2 md:p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-red-500/30">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Red Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

      {/* Featured Products */}
      <section ref={produtosRef} className="py-16 md:py-20 bg-gradient-to-b from-black via-red-950/5 to-black relative">
        <div className="absolute inset-0 bg-gradient-to-l from-black via-red-950/10 to-black"></div>
        <div className="container mx-auto px-3 md:px-4 max-w-6xl relative z-10">
          <h2 className="text-xl md:text-4xl font-bold text-center text-red-500 mb-6 md:mb-12 drop-shadow-lg">
            Destaques Exclusivos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <Card
                key={index}
                className="bg-gradient-to-br from-gray-900 to-black border-gray-800 overflow-hidden hover:border-red-500 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20"
              >
                <div className="h-48 md:h-64 bg-gradient-to-br from-red-900/50 to-red-700/50 relative overflow-hidden">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
                <CardContent className="p-3 md:p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{product.name}</h3>
                  <div className="flex items-center mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-gray-400 ml-2">({product.reviews})</span>
                  </div>
                  <div className="text-2xl font-bold text-red-500 mb-4 drop-shadow-lg">{product.price}</div>
                  <Button
                    onClick={() => openProductModal(product)}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-500/25"
                  >
                    Ver Detalhes
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Red Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

      {/* How It Works */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-black via-red-950/10 to-black relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-red-950/5 to-black"></div>
        <div className="container mx-auto px-3 md:px-4 max-w-6xl relative z-10">
          <h2 className="text-xl md:text-4xl font-bold text-center text-red-500 mb-6 md:mb-12">Como Funciona</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { step: "1", title: "Cadastre", desc: "Crie sua conta exclusiva" },
              { step: "2", title: "Explore", desc: "Descubra nossos produtos" },
              { step: "3", title: "Escolha", desc: "Selecione seus favoritos" },
              { step: "4", title: "Desfrute", desc: "Receba com discrição total" },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Red Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

      {/* Testimonials */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-black via-red-950/5 to-black relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-red-950/5 to-black"></div>
        <div className="container mx-auto px-3 md:px-4 max-w-6xl relative z-10">
          <h2 className="text-xl md:text-4xl font-bold text-center text-red-500 mb-6 md:mb-12">
            O Que Nossos Clientes Dizem
          </h2>
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-lg text-gray-300 mb-6 italic">
                  "Serviço impecável! Qualidade excepcional, entrega rápida e atendimento personalizado. A SEDUZ superou
                  todas as minhas expectativas. Recomendo sem hesitar!"
                </p>
                <div className="text-white font-semibold">Maria S.</div>
                <div className="text-gray-400">Cliente Verificada</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Red Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-black via-red-950/10 to-black relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-red-950/5 to-black"></div>
        <div className="container mx-auto px-3 md:px-4 max-w-6xl relative z-10">
          <h2 className="text-xl md:text-4xl font-bold text-center text-red-500 mb-6 md:mb-12">Perguntas Frequentes</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: "Como é feita a entrega dos produtos?",
                a: "Todas as entregas são feitas de forma totalmente discreta, sem identificação externa do conteúdo.",
              },
              {
                q: "Os produtos são originais?",
                a: "Sim, trabalhamos apenas com produtos originais e de alta qualidade, com garantia de procedência.",
              },
              {
                q: "Posso trocar ou devolver?",
                a: "Oferecemos política de troca e devolução conforme nossos termos de uso e legislação vigente.",
              },
              {
                q: "Os produtos são seguros?",
                a: "Todos os nossos produtos passam por rigoroso controle de qualidade e são certificados pelos órgãos competentes.",
              },
            ].map((faq, index) => (
              <Card key={index} className="bg-black border-gray-800">
                <CardContent className="p-0">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-white font-medium">{faq.q}</span>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-red-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-red-500" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-6">
                      <p className="text-gray-400">{faq.a}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Red Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

      {/* Newsletter Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-black via-red-950/5 to-black relative">
        <div className="absolute inset-0 bg-gradient-to-r from-black via-red-950/5 to-black"></div>
        <div className="container mx-auto px-3 md:px-4 max-w-6xl relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl md:text-4xl font-bold text-red-500 mb-4">Fique Por Dentro</h2>
            <p className="text-gray-400 mb-8">Receba novidades, ofertas exclusivas e dicas especiais</p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Seu e-mail"
                className="flex-1 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
              />
              <Button className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg">Inscrever</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Red Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

      {/* Final CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-3 md:px-4 max-w-6xl text-center">
          <h2 className="text-xl md:text-4xl font-bold text-red-500 mb-4">Explore Seus Desejos</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Descubra um mundo de possibilidades e desperte seus sentidos com nossa coleção exclusiva
          </p>
          <Button
            onClick={scrollToProdutos}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full text-lg font-medium"
          >
            Ver Todos os Produtos
          </Button>
        </div>
      </section>

      {/* Product Modal */}
      {isModalOpen && (
        <div
          className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300 overflow-hidden ${
            isAnimating ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeProductModal}
        >
          <div
            className={`mx-4 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
              isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedProduct && (
              <>
                <div className="relative h-40 md:h-64 overflow-hidden rounded-t-lg">
                  <img
                    src={selectedProduct.image || "/placeholder.svg"}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <button
                    onClick={closeProductModal}
                    className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="p-4 md:p-6">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedProduct.name}</h2>

                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-gray-400 ml-2">({selectedProduct.reviews} avaliações)</span>
                  </div>

                  <div className="text-3xl font-bold text-red-500 mb-4">{selectedProduct.price}</div>

                  <p className="text-gray-300 mb-6">{selectedProduct.description}</p>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Características:</h3>
                    <ul className="space-y-2">
                      {selectedProduct.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center text-gray-300">
                          <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={openFormModal}
                      className="w-4/5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25"
                    >
                      Fazer pedido
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && selectedProduct && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300"
          onClick={closeFormModal}
        >
          <div
            className="mx-4 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Dados para entrega</h3>
                  <p className="text-sm text-gray-400">
                    {selectedProduct.name} - {selectedProduct.price}
                  </p>
                </div>
                <button
                  onClick={closeFormModal}
                  className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Mensagem de status */}
              {submitMessage && (
                <div
                  className={`mb-4 p-3 rounded-lg text-center text-sm ${
                    submitMessage.includes("❌")
                      ? "bg-red-900/50 text-red-300"
                      : submitMessage.includes("✅")
                        ? "bg-green-900/50 text-green-300"
                        : "bg-blue-900/50 text-blue-300"
                  }`}
                >
                  {submitMessage}
                </div>
              )}

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={orderData.nome}
                  onChange={(e) => setOrderData({ ...orderData, nome: e.target.value })}
                  className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
                />

                <input
                  type="email"
                  placeholder="E-mail"
                  value={orderData.email}
                  onChange={(e) => setOrderData({ ...orderData, email: e.target.value })}
                  className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
                />

                <input
                  type="text"
                  placeholder="CPF (apenas números)"
                  value={orderData.cpf}
                  onChange={(e) => setOrderData({ ...orderData, cpf: e.target.value })}
                  className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
                />

                <input
                  type="text"
                  placeholder="CEP"
                  value={orderData.cep}
                  onChange={(e) => setOrderData({ ...orderData, cep: e.target.value })}
                  className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Estado"
                    value={orderData.estado}
                    onChange={(e) => setOrderData({ ...orderData, estado: e.target.value })}
                    className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
                  />

                  <input
                    type="text"
                    placeholder="Cidade"
                    value={orderData.cidade}
                    onChange={(e) => setOrderData({ ...orderData, cidade: e.target.value })}
                    className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Número da casa"
                  value={orderData.numeroCasa}
                  onChange={(e) => setOrderData({ ...orderData, numeroCasa: e.target.value })}
                  className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
                />

                <input
                  type="text"
                  placeholder="WhatsApp (com DDD)"
                  value={orderData.whatsapp}
                  onChange={(e) => setOrderData({ ...orderData, whatsapp: e.target.value })}
                  className="w-full px-3 py-3 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  onClick={handleRealizarPedido}
                  disabled={!isFormValid || isSubmitting}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? "Processando..." : "Realizar Pedido"}
                </Button>

                <Button
                  onClick={closeFormModal}
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIX Modal com QR Code Real */}
      {showPixModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300"
          onClick={closePixModal}
        >
          <div
            className="mx-4 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <button
                onClick={closePixModal}
                className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                ×
              </button>

              <h2 className="text-2xl font-bold text-white mb-4">Pagamento PIX</h2>

              {/* Status do Pagamento - MELHORADO */}
              {paymentStatus === "approved" && (
                <div className="mb-6 p-4 bg-green-900/50 border border-green-500 rounded-lg">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                    <div>
                      <h3 className="text-lg font-bold text-green-300">Pagamento Aprovado!</h3>
                      <p className="text-sm text-green-400">Seu pedido foi confirmado com sucesso</p>
                    </div>
                  </div>
                  <div className="bg-green-800/30 p-3 rounded-lg">
                    <p className="text-xs text-green-300">
                      ✅ Pagamento processado
                      <br />📦 Pedido em preparação
                      <br />📧 Confirmação enviada por email
                    </p>
                  </div>
                </div>
              )}

              {paymentStatus === "rejected" && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-red-300">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">Pagamento Rejeitado</span>
                  </div>
                  <p className="text-xs text-red-400 mt-1">Tente novamente ou use outro método</p>
                </div>
              )}

              {paymentStatus === "expired" && (
                <div className="mb-4 p-3 bg-yellow-900/50 border border-yellow-500 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-yellow-300">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm font-semibold">PIX Expirado</span>
                  </div>
                  <p className="text-xs text-yellow-400 mt-1">Tempo limite atingido. Gere um novo PIX</p>
                </div>
              )}

              {isPolling && paymentStatus !== "approved" && (
                <div className="mb-4 p-3 bg-blue-900/50 border border-blue-500 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-blue-300">
                    <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full flex-shrink-0"></div>
                    <span className="text-sm font-medium">Aguardando confirmação do pagamento...</span>
                  </div>
                  <div className="mt-2 text-xs text-blue-400">Verificando automaticamente a cada 3 segundos...</div>
                </div>
              )}

              {/* QR Code - só mostrar se não foi aprovado */}
              {paymentStatus !== "approved" && pixData.qr_code_base64 && (
                <div className="bg-white p-4 rounded-lg mb-4">
                  <img
                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
              )}

              {paymentStatus !== "approved" && (
                <div className="text-white mb-4">
                  <p className="text-lg font-semibold mb-2">Valor: {selectedProduct?.price}</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Escaneie o QR Code acima com o app do seu banco ou copie o código PIX
                  </p>
                </div>
              )}

              {/* Código PIX - só mostrar se não foi aprovado */}
              {paymentStatus !== "approved" && pixData.qr_code && (
                <div className="bg-gray-800 p-3 rounded-lg mb-4">
                  <p className="text-xs text-gray-400 mb-1">Código PIX:</p>
                  <p className="text-xs text-white break-all font-mono">{pixData.qr_code}</p>
                </div>
              )}

              <div className="flex gap-2">
                {paymentStatus !== "approved" && (
                  <Button
                    onClick={() => navigator.clipboard.writeText(pixData.qr_code)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Copiar Código
                  </Button>
                )}
                <Button
                  onClick={closePixModal}
                  className={`${paymentStatus === "approved" ? "w-full" : "flex-1"} bg-gray-600 hover:bg-gray-700 text-white`}
                >
                  {paymentStatus === "approved" ? "Finalizar" : "Fechar"}
                </Button>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                ID do Pagamento: {pixData.payment_id}
                {paymentStatus !== "approved" && (
                  <>
                    <br />
                    Após o pagamento, você receberá uma confirmação automática
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-red-500 mb-4">SEDUZ</h3>
              <p className="text-gray-400">Desperte seus sentidos com elegância e sofisticação.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Sobre Nós</li>
                <li>Contato</li>
                <li>Carreiras</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Central de Ajuda</li>
                <li>Política de Privacidade</li>
                <li>Termos de Uso</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Política de Cookies</li>
                <li>Termos de Serviço</li>
                <li>LGPD</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SEDUZ. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
