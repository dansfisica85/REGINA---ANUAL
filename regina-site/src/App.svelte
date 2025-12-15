<script>
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import { schoolsData, bimestreNames } from './data/schools.js';
  import { alunosPresenteData, bimestreNames as bimestreNamesAP } from './data/alunosPresente.js';
  import { biPlataformasData, bimestreNames as bimestreNamesBP } from './data/biPlataformas.js';
  import MonteCarloCalculator from './lib/monteCarlo.js';

  // Navegação
  let currentPage = 1;
  
  // Charts refs
  let annualChart = null;
  let bimestreChart = null;
  let annualChartCanvas;
  let bimestreChartCanvas;
  
  // State
  let showCalculation = false;
  let selectedSchool = null;
  let selectedBimestre = 'all';
  let calculationResults = [];
  let bimestreStats = [];
  let ranking = [];
  
  const calculator = new MonteCarloCalculator(10000);

  // Cores para o gráfico
  const colors = [
    '#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#3B1F2B',
    '#95C623', '#5C4D7D', '#E94F37', '#44BBA4', '#393E41',
    '#E7BB41', '#8B4513', '#6B8E23', '#4682B4', '#D2691E',
    '#9932CC', '#20B2AA', '#FF6347', '#4169E1', '#32CD32',
    '#FF69B4', '#8B0000', '#00CED1', '#FFD700', '#228B22', '#DC143C'
  ];

  // Dados ativos baseados na página
  $: activeData = currentPage === 1 ? schoolsData : currentPage === 2 ? alunosPresenteData : biPlataformasData;
  $: pageTitle = currentPage === 1 ? 'Plataforma SUPER BI' : currentPage === 2 ? 'Aluno Presente' : 'BI Plataformas';
  $: pageIcon = currentPage === 1 ? '📊' : currentPage === 2 ? '👥' : '💻';
  $: maxScale = currentPage === 1 ? 10 : currentPage === 2 ? 100 : 10;
  $: unitLabel = currentPage === 1 ? 'Média (0-10)' : currentPage === 2 ? 'Presença (%)' : 'Uso Plataformas (0-10)';

  function processData() {
    calculator.clearLog();
    calculationResults = [];
    bimestreStats = [];
    
    // Calcula média anual para cada escola usando Monte Carlo
    activeData.forEach(school => {
      const result = calculator.calculateAnnualMean(school.bimestres, school.name);
      calculationResults.push({
        ...school,
        ...result
      });
    });

    // Cria ranking ordenado pela média Monte Carlo
    ranking = [...calculationResults].sort((a, b) => b.monteCarloMean - a.monteCarloMean);
    ranking.forEach((item, index) => {
      item.position = index + 1;
    });

    // Calcula estatísticas por bimestre
    ['b1', 'b2', 'b3', 'b4'].forEach(bim => {
      const stats = calculator.calculateBimestreMonteCarlo(activeData, bim);
      bimestreStats.push({
        ...stats,
        name: bimestreNames[bim]
      });
    });
  }

  function createAnnualChart() {
    if (annualChart) {
      annualChart.destroy();
    }
    if (!annualChartCanvas) return;

    const sortedData = [...ranking];
    const ctx = annualChartCanvas.getContext('2d');
    
    annualChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedData.map(s => s.name.length > 25 ? s.name.substring(0, 25) + '...' : s.name),
        datasets: [{
          label: currentPage === 1 ? 'Média Anual (Monte Carlo)' : currentPage === 2 ? 'Presença Anual (Monte Carlo)' : 'Uso Plataformas (Monte Carlo)',
          data: sortedData.map(s => s.monteCarloMean),
          backgroundColor: sortedData.map((_, i) => colors[i % colors.length]),
          borderColor: sortedData.map((_, i) => colors[i % colors.length]),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: `Ranking ${currentPage === 1 ? 'de Médias' : currentPage === 2 ? 'de Presença' : 'de Uso das Plataformas'} Anuais - Método Monte Carlo`,
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const school = sortedData[context.dataIndex];
                return [
                  `${currentPage === 1 ? 'Média' : currentPage === 2 ? 'Presença' : 'Uso'} MC: ${school.monteCarloMean.toFixed(4)}${currentPage === 2 ? '%' : ''}`,
                  `IC 95%: [${school.confidenceInterval.lower.toFixed(2)} - ${school.confidenceInterval.upper.toFixed(2)}]`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: maxScale,
            title: {
              display: true,
              text: unitLabel
            }
          },
          y: {
            ticks: {
              font: { size: 10 }
            }
          }
        }
      }
    });
  }

  function createBimestreChart() {
    if (bimestreChart) {
      bimestreChart.destroy();
    }
    if (!bimestreChartCanvas) return;

    const ctx = bimestreChartCanvas.getContext('2d');
    
    let datasets;
    let labels;
    
    if (selectedBimestre === 'all') {
      labels = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];
      datasets = ranking.slice(0, 10).map((school, i) => ({
        label: school.name.length > 20 ? school.name.substring(0, 20) + '...' : school.name,
        data: [school.bimestres.b1, school.bimestres.b2, school.bimestres.b3, school.bimestres.b4],
        backgroundColor: colors[i],
        borderColor: colors[i],
        borderWidth: 2
      }));
    } else {
      const sortedByBimestre = [...calculationResults].sort((a, b) => 
        b.bimestres[selectedBimestre] - a.bimestres[selectedBimestre]
      );
      
      labels = sortedByBimestre.map(s => s.name.length > 25 ? s.name.substring(0, 25) + '...' : s.name);
      datasets = [{
        label: bimestreNames[selectedBimestre],
        data: sortedByBimestre.map(s => s.bimestres[selectedBimestre]),
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }];
    }

    bimestreChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: selectedBimestre === 'all' ? 'x' : 'y',
        plugins: {
          legend: {
            display: selectedBimestre === 'all',
            position: 'bottom'
          },
          title: {
            display: true,
            text: selectedBimestre === 'all' 
              ? 'Evolução por Bimestre (Top 10 Escolas)' 
              : `Ranking - ${bimestreNames[selectedBimestre]}`,
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: selectedBimestre === 'all' ? undefined : maxScale
          },
          y: {
            beginAtZero: selectedBimestre === 'all' ? true : false,
            max: selectedBimestre === 'all' ? maxScale : undefined,
            ticks: {
              font: { size: selectedBimestre === 'all' ? 12 : 10 }
            }
          }
        }
      }
    });
  }

  function changePage(page) {
    currentPage = page;
    selectedBimestre = 'all';
    processData();
    setTimeout(() => {
      createAnnualChart();
      createBimestreChart();
    }, 50);
  }

  function showSchoolDetails(school) {
    selectedSchool = school;
    showCalculation = true;
  }

  function closeModal() {
    showCalculation = false;
    selectedSchool = null;
  }

  function getMedalColor(position) {
    if (position === 1) return '#FFD700';
    if (position === 2) return '#C0C0C0';
    if (position === 3) return '#CD7F32';
    return '#6B7280';
  }

  function getMedalEmoji(position) {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `${position}º`;
  }

  onMount(() => {
    processData();
    createAnnualChart();
    createBimestreChart();
  });

  onDestroy(() => {
    if (annualChart) annualChart.destroy();
    if (bimestreChart) bimestreChart.destroy();
  });

  $: if (selectedBimestre && bimestreChartCanvas && ranking.length > 0) {
    createBimestreChart();
  }
</script>

<svelte:head>
  <title>Análise REGINA - Registros Educacionais</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<main>
  <!-- Navegação -->
  <nav class="navigation">
    <button 
      class="nav-btn" 
      class:active={currentPage === 1} 
      on:click={() => changePage(1)}
    >
      📊 Plataforma SUPER BI
    </button>
    <button 
      class="nav-btn" 
      class:active={currentPage === 2} 
      on:click={() => changePage(2)}
    >
      👥 Aluno Presente
    </button>
    <button 
      class="nav-btn" 
      class:active={currentPage === 3} 
      on:click={() => changePage(3)}
    >
      💻 BI Plataformas
    </button>
  </nav>

  <header class:page2={currentPage === 2} class:page3={currentPage === 3}>
    <div class="header-content">
      <h1>{pageIcon} Análise REGINA</h1>
      <p class="subtitle">Registros Educacionais Gerais e Índices Avaliativos</p>
      <p class="page-indicator">{pageTitle}</p>
      <span class="badge">Método Monte Carlo • {activeData.length} Escolas Analisadas</span>
    </div>
  </header>

  <section class="stats-overview">
    <div class="stat-card">
      <span class="stat-icon">🏫</span>
      <div class="stat-info">
        <span class="stat-value">{activeData.length}</span>
        <span class="stat-label">Escolas</span>
      </div>
    </div>
    <div class="stat-card">
      <span class="stat-icon">📈</span>
      <div class="stat-info">
        <span class="stat-value">{ranking.length > 0 ? ranking[0].monteCarloMean.toFixed(2) : '-'}{currentPage === 2 ? '%' : ''}</span>
        <span class="stat-label">{currentPage === 1 ? 'Maior Média' : currentPage === 2 ? 'Maior Presença' : 'Maior Uso'}</span>
      </div>
    </div>
    <div class="stat-card">
      <span class="stat-icon">📉</span>
      <div class="stat-info">
        <span class="stat-value">{ranking.length > 0 ? ranking[ranking.length-1].monteCarloMean.toFixed(2) : '-'}{currentPage === 2 ? '%' : ''}</span>
        <span class="stat-label">{currentPage === 1 ? 'Menor Média' : currentPage === 2 ? 'Menor Presença' : 'Menor Uso'}</span>
      </div>
    </div>
    <div class="stat-card">
      <span class="stat-icon">🎯</span>
      <div class="stat-info">
        <span class="stat-value">10.000</span>
        <span class="stat-label">Iterações MC</span>
      </div>
    </div>
  </section>

  <section class="chart-section">
    <h2>🏆 Ranking Anual das Escolas - {pageTitle}</h2>
    <div class="chart-container annual-chart">
      <canvas bind:this={annualChartCanvas}></canvas>
    </div>
  </section>

  <section class="chart-section">
    <h2>📅 Análise por Bimestre</h2>
    <div class="bimestre-selector">
      <button class:active={selectedBimestre === 'all'} on:click={() => selectedBimestre = 'all'}>
        Todos os Bimestres
      </button>
      <button class:active={selectedBimestre === 'b1'} on:click={() => selectedBimestre = 'b1'}>
        1º Bimestre
      </button>
      <button class:active={selectedBimestre === 'b2'} on:click={() => selectedBimestre = 'b2'}>
        2º Bimestre
      </button>
      <button class:active={selectedBimestre === 'b3'} on:click={() => selectedBimestre = 'b3'}>
        3º Bimestre
      </button>
      <button class:active={selectedBimestre === 'b4'} on:click={() => selectedBimestre = 'b4'}>
        4º Bimestre
      </button>
    </div>
    <div class="chart-container bimestre-chart">
      <canvas bind:this={bimestreChartCanvas}></canvas>
    </div>
  </section>

  <section class="ranking-section">
    <h2>📋 Tabela de Ranking Completo - {pageTitle}</h2>
    <p class="section-description">Clique em "MOSTRAR CÁLCULO" para ver os detalhes do método Monte Carlo</p>
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Pos.</th>
            <th>Escola</th>
            <th>Tipo</th>
            <th>1º Bim</th>
            <th>2º Bim</th>
            <th>3º Bim</th>
            <th>4º Bim</th>
            <th>{currentPage === 1 ? 'Média' : currentPage === 2 ? 'Presença' : 'Uso'} MC</th>
            <th>IC 95%</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {#each ranking as school}
            <tr class:highlight={school.position <= 3}>
              <td class="position">
                <span style="color: {getMedalColor(school.position)}; font-size: 1.2em;">
                  {getMedalEmoji(school.position)}
                </span>
              </td>
              <td class="school-name">{school.name}</td>
              <td><span class="badge-small {school.tipo === 'PEI' ? 'pei' : 'regular'}">{school.tipo}</span></td>
              <td>{school.bimestres.b1.toFixed(2)}{currentPage === 2 ? '%' : ''}</td>
              <td>{school.bimestres.b2.toFixed(2)}{currentPage === 2 ? '%' : ''}</td>
              <td>{school.bimestres.b3.toFixed(2)}{currentPage === 2 ? '%' : ''}</td>
              <td>{school.bimestres.b4.toFixed(2)}{currentPage === 2 ? '%' : ''}</td>
              <td class="mean-value">{school.monteCarloMean.toFixed(4)}{currentPage === 2 ? '%' : ''}</td>
              <td class="confidence">[{school.confidenceInterval.lower.toFixed(2)} - {school.confidenceInterval.upper.toFixed(2)}]</td>
              <td>
                <button class="show-calc-btn" on:click={() => showSchoolDetails(school)}>
                  MOSTRAR CÁLCULO
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <section class="methodology-section">
    <h2>📐 Metodologia - Simulação Monte Carlo</h2>
    <div class="methodology-content">
      <div class="method-card">
        <h3>🎲 O que é Monte Carlo?</h3>
        <p>O método de Monte Carlo é uma técnica computacional que utiliza amostragem aleatória repetida para obter resultados numéricos. É especialmente útil para estimar incertezas em medições e validar cálculos estatísticos.</p>
      </div>
      <div class="method-card">
        <h3>⚙️ Como Funciona Aqui</h3>
        <p>Para cada escola, realizamos 10.000 simulações considerando a variabilidade natural dos dados bimestrais. Aplicamos uma incerteza de 5% do desvio padrão e utilizamos a transformada de Box-Muller para gerar distribuições normais.</p>
      </div>
      <div class="method-card">
        <h3>📊 Intervalo de Confiança</h3>
        <p>O intervalo de confiança de 95% indica que há 95% de probabilidade de que a verdadeira {currentPage === 1 ? 'média' : currentPage === 2 ? 'taxa de presença' : 'taxa de uso'} esteja dentro deste intervalo. Quanto menor o intervalo, maior a precisão da estimativa.</p>
      </div>
    </div>
  </section>

  {#if showCalculation && selectedSchool}
    <div class="modal-overlay" on:click={closeModal} on:keydown={(e) => e.key === 'Escape' && closeModal()} role="button" tabindex="0">
      <div class="modal" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true">
        <button class="close-btn" on:click={closeModal}>×</button>
        <h2>🔬 Detalhes do Cálculo Monte Carlo</h2>
        <h3>{selectedSchool.name}</h3>
        
        <div class="calc-details">
          <div class="calc-section">
            <h4>📥 Dados de Entrada ({currentPage === 1 ? 'Médias' : currentPage === 2 ? 'Presença %' : 'Uso Plataformas'} Bimestrais)</h4>
            <div class="data-grid">
              <div class="data-item">
                <span class="label">1º Bimestre:</span>
                <span class="value">{selectedSchool.bimestres.b1}{currentPage === 2 ? '%' : ''}</span>
              </div>
              <div class="data-item">
                <span class="label">2º Bimestre:</span>
                <span class="value">{selectedSchool.bimestres.b2}{currentPage === 2 ? '%' : ''}</span>
              </div>
              <div class="data-item">
                <span class="label">3º Bimestre:</span>
                <span class="value">{selectedSchool.bimestres.b3.toFixed(2)}{currentPage === 2 ? '%' : ''}</span>
              </div>
              <div class="data-item">
                <span class="label">4º Bimestre:</span>
                <span class="value">{selectedSchool.bimestres.b4}{currentPage === 2 ? '%' : ''}</span>
              </div>
            </div>
          </div>

          <div class="calc-section">
            <h4>🧮 Fórmula da Média Simples</h4>
            <div class="formula">
              <code>Média = (B1 + B2 + B3 + B4) / 4</code>
              <code>Média = ({selectedSchool.bimestres.b1} + {selectedSchool.bimestres.b2} + {selectedSchool.bimestres.b3.toFixed(2)} + {selectedSchool.bimestres.b4}) / 4</code>
              <code class="result">Média Simples = {selectedSchool.simpleMean.toFixed(4)}{currentPage === 2 ? '%' : ''}</code>
            </div>
          </div>

          <div class="calc-section">
            <h4>🎲 Processo Monte Carlo</h4>
            <ol>
              <li><strong>Iterações:</strong> {selectedSchool.iterations.toLocaleString()} simulações</li>
              <li><strong>Para cada iteração:</strong>
                <ul>
                  <li>Gera valores aleatórios usando distribuição normal (Box-Muller)</li>
                  <li>Centro: valor do bimestre | Desvio: 5% do σ dos bimestres</li>
                  <li>Limita valores entre 0 e {currentPage === 2 ? '100' : '10'}</li>
                  <li>Calcula média dos 4 valores simulados</li>
                </ul>
              </li>
              <li><strong>Resultado:</strong> Média de todas as {selectedSchool.iterations.toLocaleString()} médias simuladas</li>
            </ol>
          </div>

          <div class="calc-section">
            <h4>📊 Resultados</h4>
            <div class="results-grid">
              <div class="result-item">
                <span class="label">{currentPage === 1 ? 'Média' : currentPage === 2 ? 'Presença' : 'Uso'} Simples:</span>
                <span class="value">{selectedSchool.simpleMean.toFixed(4)}{currentPage === 2 ? '%' : ''}</span>
              </div>
              <div class="result-item highlight">
                <span class="label">{currentPage === 1 ? 'Média' : currentPage === 2 ? 'Presença' : 'Uso'} Monte Carlo:</span>
                <span class="value">{selectedSchool.monteCarloMean.toFixed(4)}{currentPage === 2 ? '%' : ''}</span>
              </div>
              <div class="result-item">
                <span class="label">Desvio Padrão (Bimestres):</span>
                <span class="value">{selectedSchool.standardDeviation.toFixed(4)}</span>
              </div>
              <div class="result-item">
                <span class="label">Desvio Padrão (MC):</span>
                <span class="value">{selectedSchool.mcStandardDeviation.toFixed(4)}</span>
              </div>
              <div class="result-item">
                <span class="label">Erro de Convergência:</span>
                <span class="value">{selectedSchool.convergenceError.toFixed(6)}</span>
              </div>
              <div class="result-item confidence-result">
                <span class="label">Intervalo de Confiança 95%:</span>
                <span class="value">[{selectedSchool.confidenceInterval.lower.toFixed(4)} - {selectedSchool.confidenceInterval.upper.toFixed(4)}]</span>
              </div>
            </div>
          </div>

          <div class="calc-section">
            <h4>✅ Validação</h4>
            <p>
              O erro de convergência de <strong>{selectedSchool.convergenceError.toFixed(6)}</strong> demonstra que 
              {selectedSchool.iterations.toLocaleString()} iterações são suficientes para uma estimativa precisa.
              A diferença mínima entre a {currentPage === 1 ? 'média' : currentPage === 2 ? 'presença' : 'uso'} simples e Monte Carlo confirma a consistência do cálculo.
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <footer>
    <p>© 2025 Análise REGINA - Desenvolvido com Svelte + Chart.js + Monte Carlo</p>
    <p class="footer-note">Dados processados com {calculationResults.length > 0 ? '10.000' : '0'} iterações de simulação por escola</p>
  </footer>
</main>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: 'Inter', sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    min-height: 100vh;
    color: #fff;
  }

  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
  }

  /* Navegação */
  .navigation {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .nav-btn {
    padding: 15px 30px;
    font-size: 1.1rem;
    font-weight: 600;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  .nav-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  .nav-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: transparent;
    box-shadow: 0 5px 25px rgba(102, 126, 234, 0.5);
  }

  header {
    text-align: center;
    padding: 40px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    margin-bottom: 30px;
    box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
    transition: background 0.5s ease;
  }

  header.page2 {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    box-shadow: 0 10px 40px rgba(17, 153, 142, 0.3);
  }

  header.page3 {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    box-shadow: 0 10px 40px rgba(245, 87, 108, 0.3);
  }

  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 10px;
  }

  .subtitle {
    font-size: 1.2rem;
    opacity: 0.9;
    margin-bottom: 10px;
  }

  .page-indicator {
    font-size: 1.4rem;
    font-weight: 600;
    margin-bottom: 15px;
    text-transform: uppercase;
    letter-spacing: 2px;
  }

  .badge {
    display: inline-block;
    background: rgba(255, 255, 255, 0.2);
    padding: 8px 20px;
    border-radius: 20px;
    font-size: 0.9rem;
    backdrop-filter: blur(10px);
  }

  .stats-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.1);
    padding: 25px;
    border-radius: 15px;
    display: flex;
    align-items: center;
    gap: 15px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: transform 0.3s ease;
  }

  .stat-card:hover {
    transform: translateY(-5px);
  }

  .stat-icon {
    font-size: 2.5rem;
  }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: #667eea;
  }

  .stat-label {
    font-size: 0.9rem;
    opacity: 0.7;
  }

  .chart-section {
    background: rgba(255, 255, 255, 0.05);
    padding: 30px;
    border-radius: 20px;
    margin-bottom: 30px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .chart-section h2 {
    margin-bottom: 20px;
    font-size: 1.5rem;
  }

  .chart-container {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 15px;
    padding: 20px;
  }

  .annual-chart {
    height: 700px;
  }

  .bimestre-chart {
    height: 500px;
  }

  .bimestre-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
  }

  .bimestre-selector button {
    padding: 10px 20px;
    border: none;
    border-radius: 25px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
  }

  .bimestre-selector button:hover {
    background: rgba(102, 126, 234, 0.5);
  }

  .bimestre-selector button.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .ranking-section {
    background: rgba(255, 255, 255, 0.05);
    padding: 30px;
    border-radius: 20px;
    margin-bottom: 30px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .section-description {
    opacity: 0.7;
    margin-bottom: 20px;
  }

  .table-container {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 15px;
    overflow: hidden;
  }

  th, td {
    padding: 12px 15px;
    text-align: left;
    color: #333;
    border-bottom: 1px solid #eee;
  }

  th {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    font-weight: 600;
    position: sticky;
    top: 0;
  }

  tr:hover {
    background: rgba(102, 126, 234, 0.1);
  }

  tr.highlight {
    background: rgba(255, 215, 0, 0.1);
  }

  .position {
    font-weight: 700;
    text-align: center;
  }

  .school-name {
    font-weight: 500;
    max-width: 250px;
  }

  .badge-small {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .badge-small.pei {
    background: #10B981;
    color: #fff;
  }

  .badge-small.regular {
    background: #6B7280;
    color: #fff;
  }

  .mean-value {
    font-weight: 700;
    color: #667eea;
  }

  .confidence {
    font-size: 0.85rem;
    color: #666;
  }

  .show-calc-btn {
    padding: 8px 15px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.75rem;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .show-calc-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
  }

  .methodology-section {
    background: rgba(255, 255, 255, 0.05);
    padding: 30px;
    border-radius: 20px;
    margin-bottom: 30px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .methodology-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .method-card {
    background: rgba(255, 255, 255, 0.1);
    padding: 25px;
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .method-card h3 {
    margin-bottom: 15px;
    color: #667eea;
  }

  .method-card p {
    line-height: 1.7;
    opacity: 0.9;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal {
    background: #1a1a2e;
    border-radius: 20px;
    padding: 30px;
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    border: 2px solid #667eea;
  }

  .close-btn {
    position: absolute;
    top: 15px;
    right: 20px;
    font-size: 2rem;
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
  }

  .close-btn:hover {
    opacity: 1;
  }

  .modal h2 {
    margin-bottom: 10px;
    color: #667eea;
  }

  .modal h3 {
    margin-bottom: 25px;
    opacity: 0.9;
  }

  .calc-details {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }

  .calc-section {
    background: rgba(255, 255, 255, 0.05);
    padding: 20px;
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .calc-section h4 {
    color: #667eea;
    margin-bottom: 15px;
    font-size: 1.1rem;
  }

  .data-grid, .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
  }

  .data-item, .result-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 15px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  .result-item.highlight {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
    border: 1px solid #667eea;
  }

  .result-item.confidence-result {
    grid-column: 1 / -1;
  }

  .label {
    opacity: 0.7;
  }

  .value {
    font-weight: 600;
    color: #667eea;
  }

  .formula {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .formula code {
    display: block;
    padding: 12px 15px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    font-family: 'Courier New', monospace;
    font-size: 0.95rem;
  }

  .formula code.result {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
    border: 1px solid #667eea;
    font-weight: 700;
  }

  .calc-section ol {
    padding-left: 20px;
    line-height: 1.8;
  }

  .calc-section ul {
    padding-left: 20px;
    margin-top: 5px;
  }

  footer {
    text-align: center;
    padding: 30px;
    opacity: 0.7;
  }

  .footer-note {
    margin-top: 10px;
    font-size: 0.85rem;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 1.8rem;
    }

    .subtitle {
      font-size: 1rem;
    }

    .nav-btn {
      padding: 12px 20px;
      font-size: 0.95rem;
    }

    .chart-container.annual-chart {
      height: 900px;
    }

    th, td {
      padding: 8px 10px;
      font-size: 0.85rem;
    }

    .school-name {
      max-width: 150px;
    }
  }
</style>
