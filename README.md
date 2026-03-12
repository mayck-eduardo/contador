# 📅 Contador — Rastreador de Dias

> Aplicativo mobile para rastrear dias consecutivos de um hábito ou meta pessoal, com histórico visual, estatísticas e notificações de incentivo.

<p align="center">
  <img src="https://img.shields.io/badge/Expo-54-black?logo=expo&logoColor=white" />
  <img src="https://img.shields.io/badge/React Native-0.81-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/versão-1.0.0-10B981" />
  <img src="https://img.shields.io/badge/plataforma-Android%20%7C%20iOS-green" />
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/17826c65-13e3-4b50-9d30-432c6a404e96" width="22%" />
  <img src="https://github.com/user-attachments/assets/2cd2ceba-11b1-4b14-a972-5e756a54d394" width="22%" />
  <img src="https://github.com/user-attachments/assets/9d41910f-24b7-4110-8cf8-3634c0e416a0" width="22%" />
  <img src="https://github.com/user-attachments/assets/f7bc00a4-5959-4aa8-a9b6-2b703c42227b" width="22%" />
</p>

---

## 🎉 v1.0.0 — Primeiro Release

> **Março de 2026** · Lançamento inicial do Contador

Este é o primeiro release oficial do **Contador**, um app pensado para quem quer construir hábitos sólidos e acompanhar cada dia de progresso de forma visual e motivadora. Desenvolvido do zero com React Native + Expo, o app nasce com um conjunto completo de funcionalidades para apoiar qualquer rotina — seja academia, meditação, leitura ou qualquer meta pessoal.

### 🆕 O que há nesta versão

- **Contador diário com anel de progresso animado** — visualize seu avanço de forma imediata ao marcar um dia concluído.
- **Metas flexíveis** — escolha entre ciclos de 7, 14, 30, 60 ou 100 dias conforme o seu ritmo.
- **Painel de estatísticas** — acompanhe sua sequência atual, seu recorde pessoal e sua taxa de sucesso em tempo real.
- **Calendário com histórico completo** — veja exatamente quais dias foram marcados e quando ocorreram resets ao longo dos meses.
- **Contagem regressiva para eventos** — defina uma data alvo e veja os dias, horas e segundos restantes.
- **Frases motivacionais rotativas** — uma mensagem de incentivo diferente a cada marco alcançado.
- **Desfazer a última ação** — cometeu um engano? Reverta o registro do dia com um único toque.
- **Notificações inteligentes** — lembretes diários em horário configurável e mensagens especiais ao atingir marcos de 7, 14, 21, 30, 60 e 100 dias.
- **100% offline** — todos os dados ficam salvos localmente no dispositivo, sem necessidade de conta ou internet.

### 📸 Screenshots

> Veja as telas do app no topo deste README.

---

## ✨ Funcionalidades

- **Contador diário** — marque um dia como concluído com um único toque (uma vez por dia)
- **Anel de progresso animado** — visualize seu avanço em relação à meta definida
- **Metas configuráveis** — escolha entre 7, 14, 30, 60 ou 100 dias
- **Estatísticas em tempo real** — sequência atual, recorde pessoal e taxa de sucesso
- **Calendário com histórico** — visualize todos os dias marcados e os resets no calendário mensal
- **Frase motivacional** — mensagem de incentivo que rotaciona com o contador
- **Data de evento** — defina uma data alvo e veja a contagem regressiva
- **Desfazer última ação** — reverta o último registro feito no mesmo dia
- **Notificações push** — lembretes diários e mensagens de conquista em marcos (7, 14, 21, 30, 60 e 100 dias)
- **Persistência local** — dados salvos no dispositivo com AsyncStorage

---

## 📱 Telas

| Tela | Descrição |
|---|---|
| **Contador** | Tela principal com anel animado, botões de ação e estatísticas |
| **Histórico** | Calendário mensal colorido com legenda e grade de estatísticas |
| **Countdown** | Contagem regressiva para uma data de evento específica |
| **Configurações** | Gerenciar notificações, horário de lembrete e apps monitorados |

---

## 🚀 Como rodar localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Expo Go no celular (Android ou iOS) **ou** emulador configurado

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/contador.git
cd contador

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npx expo start
```

Escaneie o QR code com o app **Expo Go** para abrir no seu celular.

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| [Expo](https://expo.dev/) | Framework e build do app |
| [React Native](https://reactnative.dev/) | UI nativa |
| [TypeScript](https://www.typescriptlang.org/) | Tipagem estática |
| [Expo Router](https://expo.github.io/router) | Navegação baseada em arquivos |
| [react-native-svg](https://github.com/software-mansion/react-native-svg) | Anel de progresso animado |
| [react-native-calendars](https://github.com/wix/react-native-calendars) | Calendário com histórico |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | Persistência local de dados |
| [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) | Notificações push locais |
| [date-fns](https://date-fns.org/) | Manipulação de datas |

---

## 📂 Estrutura do projeto

```
contador/
├── app/
│   └── (tabs)/
│       ├── index.tsx        # Tela principal (contador)
│       ├── calendar.tsx     # Histórico no calendário
│       ├── countdown.tsx    # Contagem regressiva para evento
│       └── settings.tsx     # Configurações
├── context/
│   └── CounterContext.tsx   # Estado global com React Context
├── services/
│   └── NotificationService.ts  # Lógica de notificações
├── constants/
│   └── theme.ts             # Tokens de design
└── README.md
```

---

## 📄 Licença

Este projeto é de uso pessoal. Sinta-se livre para adaptá-lo para os seus próprios hábitos.
