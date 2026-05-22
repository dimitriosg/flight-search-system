// Seed de demonstração. Só popula se o banco estiver vazio (não apaga dados reais).
// Usa os exemplos do próprio documento (ATH>GRU economy €850, business €2.000 / €4.000).

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedObservacoes() {
  if ((await prisma.observacao.count()) > 0) return;
  const dias = (n: number) => new Date(Date.now() - n * 86400000);
  await prisma.observacao.createMany({
    data: [
      { origem: "ATH", destino: "GRU", cabine: "business", precoCash: 2900, fonte: "Google Flights", dataObservacao: dias(2) },
      { origem: "ATH", destino: "GRU", cabine: "business", precoCash: 3100, fonte: "Skyscanner", dataObservacao: dias(9) },
      { origem: "ATH", destino: "GRU", cabine: "business", precoCash: 2750, fonte: "Site da companhia", dataObservacao: dias(16) },
      { origem: "ATH", destino: "GRU", cabine: "economy", precoCash: 880, fonte: "Google Flights", dataObservacao: dias(2) },
      { origem: "ATH", destino: "GRU", cabine: "economy", precoCash: 820, fonte: "KAYAK", dataObservacao: dias(9) },
      { origem: "LIS", destino: "GRU", cabine: "business", precoCash: 2500, fonte: "Skyscanner", dataObservacao: dias(3) },
    ],
  });
  console.log("Observações de exemplo criadas.");
}

async function main() {
  await seedObservacoes();

  const existentes = await prisma.oportunidade.count();
  if (existentes > 0) {
    console.log(`Banco já possui ${existentes} oportunidade(s). Seed ignorado.`);
    return;
  }

  await prisma.rota.createMany({
    data: [
      {
        origem: "ATH",
        destino: "GRU",
        cabine: "business",
        datasDesejadas: "Set–Nov 2026",
        flexibilidadeDias: 5,
        companhiaPreferida: "Aegean / Star Alliance",
        programaMilhas: "Aegean Miles+Bonus",
        precoMedioReferencia: 2800,
        observacoes: "Prioridade máxima.",
      },
      {
        origem: "ATH",
        destino: "GRU",
        cabine: "economy",
        flexibilidadeDias: 5,
        precoMedioReferencia: 850,
      },
      {
        origem: "LIS",
        destino: "GRU",
        cabine: "business",
        flexibilidadeDias: 3,
        companhiaPreferida: "TAP",
        programaMilhas: "TAP Miles&Go",
      },
      {
        origem: "MAD",
        destino: "GRU",
        cabine: "business",
        flexibilidadeDias: 3,
        companhiaPreferida: "Iberia",
        programaMilhas: "Iberia Plus",
      },
    ],
  });

  await prisma.oportunidade.createMany({
    data: [
      {
        origem: "ATH",
        destino: "GRU",
        cabine: "economy",
        companhia: "Aegean + parceiro",
        escalas: 1,
        duracaoMinutos: 900,
        precoCash: 850,
        bagagemIncluida: true,
        compraDireta: true,
        flexCancelamento: "rigida",
        linkOferta: "https://www.google.com/travel/flights",
        status: "observar",
        observacoes: "Baseline de economy para a rota.",
      },
      {
        origem: "ATH",
        destino: "GRU",
        cabine: "business",
        companhia: "Lufthansa via FRA",
        escalas: 1,
        duracaoMinutos: 980,
        precoCash: 2000,
        bagagemIncluida: true,
        compraDireta: true,
        flexCancelamento: "flexivel",
        linkOferta: "https://www.lufthansa.com",
        status: "comparar",
        observacoes: "Exemplo do documento: ótimo negócio em business.",
      },
      {
        origem: "ATH",
        destino: "GRU",
        cabine: "business",
        companhia: "Cia. X",
        escalas: 2,
        duracaoMinutos: 1500,
        precoCash: 4000,
        bagagemIncluida: true,
        compraDireta: false,
        flexCancelamento: "desconhecida",
        status: "observar",
        observacoes: "Exemplo do documento: preço normal alto.",
      },
      {
        origem: "LIS",
        destino: "GRU",
        cabine: "business",
        companhia: "TAP",
        escalas: 0,
        duracaoMinutos: 660,
        precoCash: 2200,
        milhasNecessarias: 80000,
        taxas: 300,
        bagagemIncluida: true,
        compraDireta: true,
        flexCancelamento: "flexivel",
        linkOferta: "https://www.flytap.com",
        status: "comparar",
        observacoes: "Resgate com milhas: ~€0,0238/milha.",
      },
    ],
  });

  await prisma.alerta.createMany({
    data: [
      {
        plataforma: "Google Flights",
        rota: "ATH > GRU",
        cabine: "business",
        datas: "Set–Nov 2026",
        frequenciaDias: 1,
      },
      {
        plataforma: "Seats.aero",
        rota: "Europe > South America",
        cabine: "business",
        frequenciaDias: 1,
      },
      {
        plataforma: "Skyscanner",
        rota: "LIS > GRU",
        cabine: "business",
        frequenciaDias: 7,
      },
    ],
  });

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
