// Implementação do Método de Monte Carlo para cálculo de médias
// O método de Monte Carlo é uma técnica estatística que usa amostragem aleatória
// para obter resultados numéricos, útil para estimar incertezas e validar cálculos

/**
 * Classe para realizar cálculos usando simulação de Monte Carlo
 */
export class MonteCarloCalculator {
  constructor(iterations = 10000) {
    this.iterations = iterations;
    this.calculationLog = [];
  }

  /**
   * Gera um número aleatório com distribuição normal (Box-Muller transform)
   */
  randomNormal(mean, stdDev) {
    let u1 = Math.random();
    let u2 = Math.random();
    let z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Calcula a média anual usando Monte Carlo
   * Considera variabilidade nos dados bimestrais
   * @param {Object} bimestres - Objeto com valores b1, b2, b3, b4
   * @param {string} schoolName - Nome da escola
   * @param {number} maxValue - Valor máximo da escala (10 ou 100)
   */
  calculateAnnualMean(bimestres, schoolName, maxValue = 10) {
    const values = Object.values(bimestres);
    const simpleMean = values.reduce((a, b) => a + b, 0) / values.length;
    
    // Calcula desvio padrão dos bimestres
    const variance = values.reduce((sum, val) => sum + Math.pow(val - simpleMean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Simulação Monte Carlo
    let monteCarloResults = [];
    let sumOfMeans = 0;
    
    for (let i = 0; i < this.iterations; i++) {
      // Simula valores com variação baseada no desvio padrão
      let simulatedSum = 0;
      for (let j = 0; j < values.length; j++) {
        // Adiciona pequena variação aleatória (incerteza de medição)
        const uncertainty = stdDev * 0.05; // 5% do desvio padrão como incerteza
        const simulatedValue = this.randomNormal(values[j], uncertainty);
        simulatedSum += Math.max(0, Math.min(maxValue, simulatedValue)); // Limita entre 0 e maxValue
      }
      const simulatedMean = simulatedSum / values.length;
      monteCarloResults.push(simulatedMean);
      sumOfMeans += simulatedMean;
    }
    
    const monteCarloMean = sumOfMeans / this.iterations;
    
    // Calcula intervalo de confiança (95%)
    monteCarloResults.sort((a, b) => a - b);
    const lowerBound = monteCarloResults[Math.floor(this.iterations * 0.025)];
    const upperBound = monteCarloResults[Math.floor(this.iterations * 0.975)];
    
    // Calcula desvio padrão das simulações
    const mcVariance = monteCarloResults.reduce((sum, val) => sum + Math.pow(val - monteCarloMean, 2), 0) / this.iterations;
    const mcStdDev = Math.sqrt(mcVariance);
    
    const result = {
      schoolName,
      simpleMean: Number(simpleMean.toFixed(4)),
      monteCarloMean: Number(monteCarloMean.toFixed(4)),
      standardDeviation: Number(stdDev.toFixed(4)),
      mcStandardDeviation: Number(mcStdDev.toFixed(4)),
      confidenceInterval: {
        lower: Number(lowerBound.toFixed(4)),
        upper: Number(upperBound.toFixed(4))
      },
      bimestresUsados: { ...bimestres },
      iterations: this.iterations,
      convergenceError: Number(Math.abs(simpleMean - monteCarloMean).toFixed(6))
    };
    
    this.calculationLog.push(result);
    return result;
  }

  /**
   * Calcula estatísticas para um bimestre específico
   * @param {Array} schools - Array de escolas
   * @param {string} bimestre - Nome do bimestre (b1, b2, b3, b4)
   * @param {number} maxValue - Valor máximo da escala (10 ou 100)
   */
  calculateBimestreMonteCarlo(schools, bimestre, maxValue = 10) {
    const values = schools.map(s => s.bimestres[bimestre]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Simulação Monte Carlo para o bimestre
    let monteCarloResults = [];
    
    for (let i = 0; i < this.iterations; i++) {
      let simulatedSum = 0;
      for (const val of values) {
        const uncertainty = stdDev * 0.03;
        const simulated = this.randomNormal(val, uncertainty);
        simulatedSum += Math.max(0, Math.min(maxValue, simulated));
      }
      monteCarloResults.push(simulatedSum / values.length);
    }
    
    const mcMean = monteCarloResults.reduce((a, b) => a + b, 0) / this.iterations;
    monteCarloResults.sort((a, b) => a - b);
    
    return {
      bimestre,
      simpleMean: Number(mean.toFixed(4)),
      monteCarloMean: Number(mcMean.toFixed(4)),
      standardDeviation: Number(stdDev.toFixed(4)),
      confidenceInterval: {
        lower: Number(monteCarloResults[Math.floor(this.iterations * 0.025)].toFixed(4)),
        upper: Number(monteCarloResults[Math.floor(this.iterations * 0.975)].toFixed(4))
      },
      min: Number(Math.min(...values).toFixed(2)),
      max: Number(Math.max(...values).toFixed(2)),
      iterations: this.iterations
    };
  }

  /**
   * Retorna o log de todos os cálculos realizados
   */
  getCalculationLog() {
    return this.calculationLog;
  }

  /**
   * Limpa o log de cálculos
   */
  clearLog() {
    this.calculationLog = [];
  }

  /**
   * Gera relatório detalhado de um cálculo
   */
  generateReport(result) {
    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║  RELATÓRIO DE CÁLCULO MONTE CARLO                                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Escola: ${result.schoolName.padEnd(65)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║  DADOS DE ENTRADA (Médias Bimestrais):                                       ║
║    1º Bimestre: ${String(result.bimestresUsados.b1).padEnd(10)} 2º Bimestre: ${String(result.bimestresUsados.b2).padEnd(22)}║
║    3º Bimestre: ${String(result.bimestresUsados.b3).padEnd(10)} 4º Bimestre: ${String(result.bimestresUsados.b4).padEnd(22)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║  MÉTODO DE CÁLCULO:                                                          ║
║    • Algoritmo: Simulação Monte Carlo com ${String(result.iterations).padEnd(6)} iterações              ║
║    • Distribuição: Normal (Box-Muller Transform)                             ║
║    • Incerteza aplicada: 5% do desvio padrão                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  RESULTADOS:                                                                 ║
║    Média Simples:        ${String(result.simpleMean.toFixed(4)).padEnd(50)}║
║    Média Monte Carlo:    ${String(result.monteCarloMean.toFixed(4)).padEnd(50)}║
║    Desvio Padrão:        ${String(result.standardDeviation.toFixed(4)).padEnd(50)}║
║    Erro de Convergência: ${String(result.convergenceError.toFixed(6)).padEnd(50)}║
╠══════════════════════════════════════════════════════════════════════════════╣
║  INTERVALO DE CONFIANÇA (95%):                                               ║
║    Limite Inferior: ${String(result.confidenceInterval.lower.toFixed(4)).padEnd(55)}║
║    Limite Superior: ${String(result.confidenceInterval.upper.toFixed(4)).padEnd(55)}║
╚══════════════════════════════════════════════════════════════════════════════╝
`;
  }
}

export default MonteCarloCalculator;
