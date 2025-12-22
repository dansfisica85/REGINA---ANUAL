# 📊 Análise REGINA - Registros Educacionais Gerais e Índices Avaliativos

![Svelte](https://img.shields.io/badge/Svelte-4A4A55?style=for-the-badge&logo=svelte&logoColor=FF3E00)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

Sistema de análise estatística educacional que utiliza o **Método Monte Carlo** para calcular médias anuais e gerar rankings de desempenho de escolas.

## 🎯 Sobre o Projeto

O **Análise REGINA** é uma aplicação web desenvolvida em Svelte que processa dados educacionais de 26 escolas, aplicando simulação Monte Carlo para validar estatisticamente os resultados e fornecer intervalos de confiança precisos.

### 📈 Funcionalidades Principais

- **Cálculo de Médias Anuais** usando simulação Monte Carlo (10.000 iterações)
- **Ranking Interativo** das escolas por desempenho
- **Gráficos de Barras** comparativos (Chart.js)
- **Análise por Bimestre** com seletor dinâmico
- **Intervalos de Confiança** de 95% para cada escola
- **Botão "MOSTRAR CÁLCULO"** para transparência nos cálculos
- **3 Páginas de Análise** com diferentes métricas

## 📑 Páginas do Sistema

| Página | Descrição | Escala | Cor do Header |
| -------- | ----------- | -------- | --------------- |
| 📊 **SUPER BI** | Médias de desempenho das escolas | 0-10 | Roxo |
| 👥 **Aluno Presente** | Taxa de presença dos alunos | 0-100% | Verde |
| 💻 **BI Plataformas** | Uso das plataformas educacionais | 0-100% | Rosa |
| 🤝 **Apoio Presencial** | Médias de apoio presencial | Variável | Rosa/Vermelho |
| 📝 **Tarefas** | Percentual de conclusão de tarefas | 0-100% | Amarelo |
| 🏫 **Dashboard Individual** | Análise completa por escola | Todos | Gradiente |

> ⚠️ **IMPORTANTE:** Clique 2X (duas vezes!) no botão escolhido para carregar a página!!!

## 🔬 Metodologia - Simulação Monte Carlo

### O que é Monte Carlo?

O método de Monte Carlo é uma técnica computacional que utiliza **amostragem aleatória repetida** para obter resultados numéricos. É especialmente útil para estimar incertezas em medições e validar cálculos estatísticos.

### Como Funciona no REGINA

```
Para cada escola:
1. Coleta os 4 valores bimestrais
2. Calcula o desvio padrão dos bimestres
3. Define incerteza = 5% do desvio padrão
4. Executa 10.000 iterações:
   - Gera valores aleatórios usando Box-Muller (distribuição normal)
   - Centro: valor do bimestre | Desvio: incerteza calculada
   - Limita valores entre 0 e máximo da escala
   - Calcula média dos 4 valores simulados
5. Resultado: Média de todas as 10.000 médias simuladas
6. Calcula intervalo de confiança de 95%
```

### Transformada de Box-Muller

Utilizamos a transformada de Box-Muller para gerar números aleatórios com distribuição normal:

```javascript
const u1 = Math.random();
const u2 = Math.random();
const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
return mean + z0 * stdDev;
```

## 🚀 Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 14 ou superior)
- npm (incluído com Node.js)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/dansfisica85/REGINA---ANUAL.git

# Entre na pasta do projeto
cd REGINA---ANUAL/regina-site

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Acesso

Após executar, acesse: **<http://localhost:8080>**

## 📁 Estrutura do Projeto

```
REGINA - ANUAL/
├── 📄 README.md
├── 📊 BI PLATAFORMAS - 2025 por semana inicio na semana.xlsx
├── 📊 plataforma ALUNO PRESENTE 2025 por semana inicio na semana.xlsx
├── 📊 plataforma SUPER Bi 2025 por semana inicio na semana.xlsx
└── 📁 regina-site/
    ├── 📁 public/
    │   ├── favicon.png
    │   ├── global.css
    │   └── index.html
    ├── 📁 src/
    │   ├── 📁 data/
    │   │   ├── schools.js          # Dados SUPER BI
    │   │   ├── alunosPresente.js   # Dados Aluno Presente
    │   │   └── biPlataformas.js    # Dados BI Plataformas
    │   ├── 📁 lib/
    │   │   └── monteCarlo.js       # Calculadora Monte Carlo
    │   ├── App.svelte              # Componente principal
    │   └── main.js                 # Ponto de entrada
    ├── package.json
    └── rollup.config.js
```

## 📊 Dados Analisados

### Escolas (26 unidades)

O sistema analisa dados de 26 escolas, incluindo:

- **Escolas PEI** (Programa de Ensino Integral)
- **Escolas Regulares** (1, 2 e 3 turnos)

### Métricas por Bimestre

- **1º Bimestre** (Fevereiro - Abril)
- **2º Bimestre** (Abril - Junho)
- **3º Bimestre** (Agosto - Setembro)
- **4º Bimestre** (Outubro - Dezembro)

## 🎨 Interface

### Recursos Visuais

- **Design Responsivo** - Funciona em desktop e mobile
- **Tema Escuro** - Gradientes modernos
- **Gráficos Interativos** - Tooltips com detalhes
- **Tabela com Ranking** - Medalhas para top 3 🥇🥈🥉
- **Modal de Cálculos** - Detalhamento completo

### Navegação

Três botões no topo permitem alternar entre as páginas:

- Cada página mantém o mesmo design
- Cores distintas para fácil identificação
- Transições suaves entre páginas

## 📐 Resultados Estatísticos

Para cada escola, o sistema fornece:

| Métrica | Descrição |
| --------- | ----------- |
| **Média Simples** | Média aritmética dos 4 bimestres |
| **Média Monte Carlo** | Média validada por simulação |
| **Desvio Padrão** | Variabilidade dos bimestres |
| **Erro de Convergência** | Precisão da simulação |
| **IC 95%** | Intervalo de confiança |

## 🛠️ Tecnologias Utilizadas

- **[Svelte](https://svelte.dev/)** - Framework de UI reativo
- **[Chart.js](https://www.chartjs.org/)** - Biblioteca de gráficos
- **[Rollup](https://rollupjs.org/)** - Bundler JavaScript
- **[Sirv](https://github.com/lukeed/sirv)** - Servidor de desenvolvimento

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento com hot-reload
npm run dev

# Build para produção
npm run build

# Iniciar servidor de produção
npm run start
```

## 🔧 Configuração

### Adicionando Novos Dados

Para adicionar novos dados de escolas, edite os arquivos em `src/data/`:

```javascript
// Exemplo de estrutura de dados
export const schoolsData = [
  {
    name: "Nome da Escola",
    tipo: "PEI", // ou "Regular"
    turno: "1 T", // "1 T", "2 T" ou "3 T"
    alunos: 500,
    bimestres: { b1: 7.5, b2: 8.0, b3: 7.8, b4: 8.2 }
  },
  // ... mais escolas
];
```

### Ajustando Parâmetros Monte Carlo

No arquivo `src/lib/monteCarlo.js`:

```javascript
// Número de iterações (padrão: 10.000)
const calculator = new MonteCarloCalculator(10000);

// Fator de incerteza (padrão: 5%)
this.uncertaintyFactor = 0.05;
```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona NovaFeature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## �‍🏫 Criador

**Profº Davi Antonino Nunes da Silva**

- 📧 **E-mails:**
  - <davi.silva@educacao.sp.gov.br>
  - <professordavi85@gmail.com>
- 📱 **WhatsApp:** (16) 99260-4315

---

<p align="center">
  <strong>© 2025 Análise REGINA</strong><br>
  Desenvolvido com ❤️ usando Svelte + Chart.js + Monte Carlo<br><br>
  <strong>👨‍🏫 Criado por: Profº Davi Antonino Nunes da Silva</strong><br>
  📧 davi.silva@educacao.sp.gov.br | professordavi85@gmail.com<br>
  📱 WhatsApp: (16) 99260-4315
</p>
