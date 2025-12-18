<script>
  import { onMount, onDestroy } from 'svelte';
  import Chart from 'chart.js/auto';
  import { schoolsData, bimestreNames } from './data/schools.js';
  import { alunosPresenteData, bimestreNames as bimestreNamesAP } from './data/alunosPresente.js';
  import { biPlataformasData, bimestreNames as bimestreNamesBP } from './data/biPlataformas.js';
  import { apoioPresencialData, bimestreNames as bimestreNamesAPres } from './data/apoioPresencial.js';
  import { tarefasData, bimestreNames as bimestreNamesTar } from './data/tarefas.js';
  import { biRedacaoData, bimestreNames as bimestreNamesRed } from './data/biRedacao.js';
  import { khanAcademyData, bimestreNames as bimestreNamesKhan } from './data/khanAcademy.js';
  import { aluraData, bimestreNames as bimestreNamesAlura } from './data/alura.js';
  import { matificData, bimestreNames as bimestreNamesMatific } from './data/matific.js';
  import { speakData, bimestreNames as bimestreNamesSpeak } from './data/speak.js';
  import MonteCarloCalculator from './lib/monteCarlo.js';

  // Navegação
  let currentPage = 1;
  
  // Charts refs
  let annualChart = null;
  let bimestreChart = null;
  let annualChartCanvas;
  let bimestreChartCanvas;
  
  // Charts para página 6 (Dashboard Individual)
  let radarChart = null;
  let radarChartCanvas;
  let evolutionChart = null;
  let evolutionChartCanvas;
  let comparisonChart = null;
  let comparisonChartCanvas;
  
  // State
  let showCalculation = false;
  let selectedSchool = null;
  let selectedBimestre = 'all';
  let calculationResults = [];
  let bimestreStats = [];
  let ranking = [];
  
  // State página 6
  let selectedSchoolDashboard = null;
  let allSchoolsData = [];
  
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
  $: activeData = currentPage === 1 ? schoolsData : 
                  currentPage === 2 ? alunosPresenteData : 
                  currentPage === 3 ? biPlataformasData : 
                  currentPage === 4 ? apoioPresencialData : 
                  currentPage === 5 ? tarefasData :
                  currentPage === 7 ? biRedacaoData :
                  currentPage === 8 ? khanAcademyData :
                  currentPage === 9 ? aluraData :
                  currentPage === 10 ? matificData :
                  currentPage === 11 ? speakData : schoolsData;
  
  $: pageTitle = currentPage === 1 ? 'Plataforma SUPER BI' : 
                 currentPage === 2 ? 'Aluno Presente' : 
                 currentPage === 3 ? 'BI Plataformas' : 
                 currentPage === 4 ? 'Apoio Presencial' : 
                 currentPage === 5 ? 'Tarefas' :
                 currentPage === 7 ? 'BI Redação' :
                 currentPage === 8 ? 'Khan Academy' :
                 currentPage === 9 ? 'Alura' :
                 currentPage === 10 ? 'Matific' :
                 currentPage === 11 ? 'Speak' : 'Dashboard Individual';
  
  $: pageIcon = currentPage === 1 ? '📊' : 
                currentPage === 2 ? '👥' : 
                currentPage === 3 ? '💻' : 
                currentPage === 4 ? '🤝' : 
                currentPage === 5 ? '📝' :
                currentPage === 7 ? '✍️' :
                currentPage === 8 ? '🎓' :
                currentPage === 9 ? '🖥️' :
                currentPage === 10 ? '🔢' :
                currentPage === 11 ? '🗣️' : '🏫';
  
  $: maxScale = currentPage === 1 ? 10 : 
                currentPage === 4 ? 20 :
                currentPage === 9 ? 10 :
                currentPage === 10 ? 10 :
                currentPage === 11 ? 10 : 100;
  
  $: unitLabel = currentPage === 1 ? 'Média (0-10)' : 
                 currentPage === 2 ? 'Presença (%)' : 
                 currentPage === 3 ? 'Uso Plataformas (%)' : 
                 currentPage === 4 ? 'Apoio Presencial (média)' : 
                 currentPage === 5 ? 'Conclusão Tarefas (%)' :
                 currentPage === 7 ? 'Índice Redação (%)' :
                 currentPage === 8 ? 'Uso Khan Academy (%)' :
                 currentPage === 9 ? 'Uso Alura (média)' :
                 currentPage === 10 ? 'Uso Matific (0-10)' :
                 currentPage === 11 ? 'Uso Speak (0-10)' : '';

  // Função para determinar se a página atual usa porcentagem
  // Página 9 (Alura) usa média como página 1, não porcentagem
  // Páginas 10 (Matific) e 11 (Speak) usam escala 0-10, não porcentagem
  $: usesPercentage = currentPage === 2 || currentPage === 3 || currentPage === 5 || currentPage === 7 || currentPage === 8;
  
  // Labels específicos por página
  $: metricLabel = currentPage === 1 ? 'Média' : 
                   currentPage === 2 ? 'Presença' : 
                   currentPage === 3 ? 'Uso' : 
                   currentPage === 4 ? 'Apoio' : 
                   currentPage === 5 ? 'Tarefas' :
                   currentPage === 7 ? 'Redação' :
                   currentPage === 8 ? 'Khan' :
                   currentPage === 9 ? 'Alura' :
                   currentPage === 10 ? 'Matific' :
                   currentPage === 11 ? 'Speak' : 'Valor';

  function processData() {
    calculator.clearLog();
    calculationResults = [];
    bimestreStats = [];
    
    // Calcula média anual para cada escola usando Monte Carlo
    activeData.forEach(school => {
      const result = calculator.calculateAnnualMean(school.bimestres, school.name, maxScale);
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
      const stats = calculator.calculateBimestreMonteCarlo(activeData, bim, maxScale);
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
          label: `${metricLabel} Anual (Monte Carlo)`,
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
            text: `Ranking de ${metricLabel} Anuais - Método Monte Carlo`,
            font: { size: 16, weight: 'bold' }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const school = sortedData[context.dataIndex];
                return [
                  `${metricLabel} MC: ${school.monteCarloMean.toFixed(4)}${usesPercentage ? '%' : ''}`,
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
    
    if (page === 6) {
      prepareAllSchoolsData();
      setTimeout(() => {
        if (!selectedSchoolDashboard && allSchoolsData.length > 0) {
          selectSchoolForDashboard(allSchoolsData[0].name);
        }
      }, 50);
    } else {
      processData();
      setTimeout(() => {
        createAnnualChart();
        createBimestreChart();
      }, 50);
    }
  }

  function prepareAllSchoolsData() {
    // Cria uma lista consolidada de todas as escolas com dados de todas as planilhas
    const schoolNames = new Set();
    
    [schoolsData, alunosPresenteData, biPlataformasData, apoioPresencialData, tarefasData, biRedacaoData, khanAcademyData, aluraData, matificData, speakData].forEach(dataset => {
      dataset.forEach(school => schoolNames.add(school.name));
    });
    
    allSchoolsData = Array.from(schoolNames).map(name => {
      const superBI = schoolsData.find(s => s.name === name);
      const alunoPresente = alunosPresenteData.find(s => s.name === name);
      const biPlataformas = biPlataformasData.find(s => s.name === name);
      const apoioPresencial = apoioPresencialData.find(s => s.name === name);
      const tarefas = tarefasData.find(s => s.name === name);
      const biRedacao = biRedacaoData.find(s => s.name === name);
      const khanAcademy = khanAcademyData.find(s => s.name === name);
      const alura = aluraData.find(s => s.name === name);
      const matific = matificData.find(s => s.name === name);
      const speak = speakData.find(s => s.name === name);
      
      // Calcular médias MC para cada indicador
      const calcMedia = (school, maxVal) => {
        if (!school) return null;
        const result = calculator.calculateAnnualMean(school.bimestres, school.name, maxVal);
        return result;
      };
      
      return {
        name,
        tipo: superBI?.tipo || alunoPresente?.tipo || 'Regular',
        turno: superBI?.turno || alunoPresente?.turno || '1 T',
        alunos: superBI?.alunos || alunoPresente?.alunos || 0,
        superBI: superBI ? { ...superBI, ...calcMedia(superBI, 10) } : null,
        alunoPresente: alunoPresente ? { ...alunoPresente, ...calcMedia(alunoPresente, 100) } : null,
        biPlataformas: biPlataformas ? { ...biPlataformas, ...calcMedia(biPlataformas, 100) } : null,
        apoioPresencial: apoioPresencial ? { ...apoioPresencial, ...calcMedia(apoioPresencial, 20) } : null,
        tarefas: tarefas ? { ...tarefas, ...calcMedia(tarefas, 100) } : null,
        biRedacao: biRedacao ? { ...biRedacao, ...calcMedia(biRedacao, 100) } : null,
        khanAcademy: khanAcademy ? { ...khanAcademy, ...calcMedia(khanAcademy, 100) } : null,
        alura: alura ? { ...alura, ...calcMedia(alura, 10) } : null,
        matific: matific ? { ...matific, ...calcMedia(matific, 100) } : null,
        speak: speak ? { ...speak, ...calcMedia(speak, 100) } : null
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }
  
  function selectSchoolForDashboard(schoolName) {
    selectedSchoolDashboard = allSchoolsData.find(s => s.name === schoolName);
    setTimeout(() => {
      createRadarChart();
      createEvolutionChart();
      createComparisonChart();
    }, 50);
  }
  
  function createRadarChart() {
    if (radarChart) radarChart.destroy();
    if (!radarChartCanvas || !selectedSchoolDashboard) return;
    
    const ctx = radarChartCanvas.getContext('2d');
    const school = selectedSchoolDashboard;
    
    // Normalizar valores para escala 0-100
    const normalize = (val, max) => val ? (val / max) * 100 : 0;
    
    const data = [
      school.superBI ? normalize(school.superBI.monteCarloMean, 10) : 0,
      school.alunoPresente ? school.alunoPresente.monteCarloMean : 0,
      school.biPlataformas ? school.biPlataformas.monteCarloMean : 0,
      school.apoioPresencial ? normalize(school.apoioPresencial.monteCarloMean, 15) : 0,
      school.tarefas ? school.tarefas.monteCarloMean : 0,
      school.biRedacao ? school.biRedacao.monteCarloMean : 0,
      school.khanAcademy ? school.khanAcademy.monteCarloMean : 0,
      school.alura ? normalize(school.alura.monteCarloMean, 10) : 0,
      school.matific ? school.matific.monteCarloMean : 0,
      school.speak ? school.speak.monteCarloMean : 0
    ];
    
    radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['SUPER BI', 'Aluno Presente', 'BI Plataformas', 'Apoio Presencial', 'Tarefas', 'BI Redação', 'Khan Academy', 'Alura', 'Matific', 'Speak'],
        datasets: [{
          label: school.name,
          data: data,
          backgroundColor: 'rgba(102, 126, 234, 0.3)',
          borderColor: '#667eea',
          borderWidth: 2,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#667eea'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Perfil de Desempenho (Normalizado 0-100)',
            font: { size: 14, weight: 'bold' }
          },
          legend: { display: false }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: { stepSize: 20 },
            pointLabels: { font: { size: 11 } }
          }
        }
      }
    });
  }
  
  function createEvolutionChart() {
    if (evolutionChart) evolutionChart.destroy();
    if (!evolutionChartCanvas || !selectedSchoolDashboard) return;
    
    const ctx = evolutionChartCanvas.getContext('2d');
    const school = selectedSchoolDashboard;
    
    const datasets = [];
    const labels = ['1º Bim', '2º Bim', '3º Bim', '4º Bim'];
    
    if (school.superBI) {
      datasets.push({
        label: 'SUPER BI (x10)',
        data: [school.superBI.bimestres.b1 * 10, school.superBI.bimestres.b2 * 10, 
               school.superBI.bimestres.b3 * 10, school.superBI.bimestres.b4 * 10],
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.3
      });
    }
    if (school.alunoPresente) {
      datasets.push({
        label: 'Aluno Presente (%)',
        data: [school.alunoPresente.bimestres.b1, school.alunoPresente.bimestres.b2, 
               school.alunoPresente.bimestres.b3, school.alunoPresente.bimestres.b4],
        borderColor: '#11998e',
        backgroundColor: 'rgba(17, 153, 142, 0.1)',
        tension: 0.3
      });
    }
    if (school.biPlataformas) {
      datasets.push({
        label: 'BI Plataformas (%)',
        data: [school.biPlataformas.bimestres.b1, school.biPlataformas.bimestres.b2, 
               school.biPlataformas.bimestres.b3, school.biPlataformas.bimestres.b4],
        borderColor: '#f5576c',
        backgroundColor: 'rgba(245, 87, 108, 0.1)',
        tension: 0.3
      });
    }
    if (school.apoioPresencial) {
      datasets.push({
        label: 'Apoio Presencial (x10)',
        data: [school.apoioPresencial.bimestres.b1 * 10, school.apoioPresencial.bimestres.b2 * 10, 
               school.apoioPresencial.bimestres.b3 * 10, school.apoioPresencial.bimestres.b4 * 10],
        borderColor: '#f093fb',
        backgroundColor: 'rgba(240, 147, 251, 0.1)',
        tension: 0.3
      });
    }
    if (school.tarefas) {
      datasets.push({
        label: 'Tarefas (%)',
        data: [school.tarefas.bimestres.b1, school.tarefas.bimestres.b2, 
               school.tarefas.bimestres.b3, school.tarefas.bimestres.b4],
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        tension: 0.3
      });
    }
    if (school.biRedacao) {
      datasets.push({
        label: 'BI Redação (%)',
        data: [school.biRedacao.bimestres.b1, school.biRedacao.bimestres.b2, 
               school.biRedacao.bimestres.b3, school.biRedacao.bimestres.b4],
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        tension: 0.3
      });
    }
    if (school.khanAcademy) {
      datasets.push({
        label: 'Khan Academy (%)',
        data: [school.khanAcademy.bimestres.b1, school.khanAcademy.bimestres.b2, 
               school.khanAcademy.bimestres.b3, school.khanAcademy.bimestres.b4],
        borderColor: '#14BF96',
        backgroundColor: 'rgba(20, 191, 150, 0.1)',
        tension: 0.3
      });
    }
    if (school.alura) {
      datasets.push({
        label: 'Alura (x10)',
        data: [school.alura.bimestres.b1 * 10, school.alura.bimestres.b2 * 10, 
               school.alura.bimestres.b3 * 10, school.alura.bimestres.b4 * 10],
        borderColor: '#9B59B6',
        backgroundColor: 'rgba(155, 89, 182, 0.1)',
        tension: 0.3
      });
    }
    if (school.matific) {
      datasets.push({
        label: 'Matific (%)',
        data: [school.matific.bimestres.b1, school.matific.bimestres.b2, 
               school.matific.bimestres.b3, school.matific.bimestres.b4],
        borderColor: '#E74C3C',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        tension: 0.3
      });
    }
    if (school.speak) {
      datasets.push({
        label: 'Speak (%)',
        data: [school.speak.bimestres.b1, school.speak.bimestres.b2, 
               school.speak.bimestres.b3, school.speak.bimestres.b4],
        borderColor: '#3498DB',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        tension: 0.3
      });
    }
    
    evolutionChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Evolução por Bimestre',
            font: { size: 14, weight: 'bold' }
          },
          legend: {
            position: 'bottom',
            labels: { font: { size: 10 } }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 110,
            title: { display: true, text: 'Valor (normalizado)' }
          }
        }
      }
    });
  }
  
  function createComparisonChart() {
    if (comparisonChart) comparisonChart.destroy();
    if (!comparisonChartCanvas || !selectedSchoolDashboard) return;
    
    const ctx = comparisonChartCanvas.getContext('2d');
    const school = selectedSchoolDashboard;
    
    // Calcular médias gerais de todas as escolas para comparação
    const avgSuperBI = schoolsData.reduce((acc, s) => acc + (s.bimestres.b1 + s.bimestres.b2 + s.bimestres.b3 + s.bimestres.b4) / 4, 0) / schoolsData.length;
    const avgAlunoPresente = alunosPresenteData.reduce((acc, s) => acc + (s.bimestres.b1 + s.bimestres.b2 + s.bimestres.b3 + s.bimestres.b4) / 4, 0) / alunosPresenteData.length;
    const avgBiPlataformas = biPlataformasData.reduce((acc, s) => acc + (s.bimestres.b1 + s.bimestres.b2 + s.bimestres.b3 + s.bimestres.b4) / 4, 0) / biPlataformasData.length;
    const avgApoioPresencial = apoioPresencialData.reduce((acc, s) => acc + (s.bimestres.b1 + s.bimestres.b2 + s.bimestres.b3 + s.bimestres.b4) / 4, 0) / apoioPresencialData.length;
    const avgTarefas = tarefasData.reduce((acc, s) => acc + (s.bimestres.b1 + s.bimestres.b2 + s.bimestres.b3 + s.bimestres.b4) / 4, 0) / tarefasData.length;
    const avgBiRedacao = biRedacaoData.reduce((acc, s) => acc + (s.bimestres.b1 + s.bimestres.b2 + s.bimestres.b3 + s.bimestres.b4) / 4, 0) / biRedacaoData.length;
    const avgKhanAcademy = khanAcademyData.reduce((acc, s) => acc + (s.bimestres.b1 + s.bimestres.b2 + s.bimestres.b3 + s.bimestres.b4) / 4, 0) / khanAcademyData.length;
    const avgMatific = matificData.reduce((acc, s) => acc + (s.bimestres.b1 + s.bimestres.b2 + s.bimestres.b3 + s.bimestres.b4) / 4, 0) / matificData.length;
    const avgSpeak = speakData.reduce((acc, s) => acc + (s.bimestres.b1 + s.bimestres.b2 + s.bimestres.b3 + s.bimestres.b4) / 4, 0) / speakData.length;
    
    const labels = ['SUPER BI', 'Aluno Presente', 'BI Plataformas', 'Apoio Presencial', 'Tarefas', 'BI Redação', 'Khan Academy', 'Matific', 'Speak'];
    
    // Normalizar para escala 0-100 para comparação justa
    const schoolData = [
      school.superBI ? school.superBI.monteCarloMean * 10 : 0,
      school.alunoPresente ? school.alunoPresente.monteCarloMean : 0,
      school.biPlataformas ? school.biPlataformas.monteCarloMean : 0,
      school.apoioPresencial ? (school.apoioPresencial.monteCarloMean / 15) * 100 : 0,
      school.tarefas ? school.tarefas.monteCarloMean : 0,
      school.biRedacao ? school.biRedacao.monteCarloMean : 0,
      school.khanAcademy ? school.khanAcademy.monteCarloMean : 0,
      school.matific ? school.matific.monteCarloMean : 0,
      school.speak ? school.speak.monteCarloMean : 0
    ];
    
    const avgData = [
      avgSuperBI * 10,
      avgAlunoPresente,
      avgBiPlataformas,
      (avgApoioPresencial / 15) * 100,
      avgTarefas,
      avgBiRedacao,
      avgKhanAcademy,
      avgMatific,
      avgSpeak
    ];
    
    comparisonChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: school.name,
            data: schoolData,
            backgroundColor: 'rgba(102, 126, 234, 0.8)',
            borderColor: '#667eea',
            borderWidth: 1
          },
          {
            label: 'Média Geral',
            data: avgData,
            backgroundColor: 'rgba(251, 146, 60, 0.6)',
            borderColor: '#f97316',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Comparação com Média Geral (Normalizado)',
            font: { size: 14, weight: 'bold' }
          },
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 110,
            title: { display: true, text: 'Valor (normalizado 0-100)' }
          }
        }
      }
    });
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
    if (radarChart) radarChart.destroy();
    if (evolutionChart) evolutionChart.destroy();
    if (comparisonChart) comparisonChart.destroy();
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
      📊 SUPER BI
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
    <button 
      class="nav-btn" 
      class:active={currentPage === 4} 
      on:click={() => changePage(4)}
    >
      🤝 Apoio Presencial
    </button>
    <button 
      class="nav-btn" 
      class:active={currentPage === 5} 
      on:click={() => changePage(5)}
    >
      📝 Tarefas
    </button>
    <button 
      class="nav-btn" 
      class:active={currentPage === 7} 
      on:click={() => changePage(7)}
    >
      ✍️ BI Redação
    </button>
    <button 
      class="nav-btn" 
      class:active={currentPage === 8} 
      on:click={() => changePage(8)}
    >
      🎓 Khan Academy
    </button>
    <button 
      class="nav-btn" 
      class:active={currentPage === 9} 
      on:click={() => changePage(9)}
    >
      🖥️ Alura
    </button>
    <button 
      class="nav-btn" 
      class:active={currentPage === 10} 
      on:click={() => changePage(10)}
    >
      🔢 Matific
    </button>
    <button 
      class="nav-btn" 
      class:active={currentPage === 11} 
      on:click={() => changePage(11)}
    >
      🗣️ Speak
    </button>
    <button 
      class="nav-btn dashboard-btn" 
      class:active={currentPage === 6} 
      on:click={() => changePage(6)}
    >
      🏫 Dashboard Individual
    </button>
  </nav>

  <div class="warning-notice">
    ⚠️ Clique 2X (duas vezes!) no botão escolhido para carregar a página!!!
  </div>

  <header class:page2={currentPage === 2} class:page3={currentPage === 3} class:page4={currentPage === 4} class:page5={currentPage === 5} class:page6={currentPage === 6} class:page7={currentPage === 7} class:page8={currentPage === 8} class:page9={currentPage === 9} class:page10={currentPage === 10} class:page11={currentPage === 11}>
    <div class="header-content">
      <h1>{pageIcon} Análise REGINA</h1>
      <p class="subtitle">Registros Educacionais Gerais e Índices Avaliativos</p>
      <p class="page-indicator">{pageTitle}</p>
      <span class="badge">Método Monte Carlo • {currentPage === 6 ? '26' : activeData.length} Escolas Analisadas</span>
    </div>
  </header>

  {#if currentPage !== 6}

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
        <span class="stat-value">{ranking.length > 0 ? ranking[0].monteCarloMean.toFixed(2) : '-'}{currentPage !== 1 && currentPage !== 9 ? '%' : ''}</span>
        <span class="stat-label">{currentPage === 1 || currentPage === 9 ? 'Maior Média' : currentPage === 2 ? 'Maior Presença' : 'Maior Uso'}</span>
      </div>
    </div>
    <div class="stat-card">
      <span class="stat-icon">📉</span>
      <div class="stat-info">
        <span class="stat-value">{ranking.length > 0 ? ranking[ranking.length-1].monteCarloMean.toFixed(2) : '-'}{currentPage !== 1 && currentPage !== 9 ? '%' : ''}</span>
        <span class="stat-label">{currentPage === 1 || currentPage === 9 ? 'Menor Média' : currentPage === 2 ? 'Menor Presença' : 'Menor Uso'}</span>
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
            <th>{metricLabel} MC</th>
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
              <td>{school.bimestres.b1.toFixed(2)}{usesPercentage ? '%' : ''}</td>
              <td>{school.bimestres.b2.toFixed(2)}{usesPercentage ? '%' : ''}</td>
              <td>{school.bimestres.b3.toFixed(2)}{usesPercentage ? '%' : ''}</td>
              <td>{school.bimestres.b4.toFixed(2)}{usesPercentage ? '%' : ''}</td>
              <td class="mean-value">{school.monteCarloMean.toFixed(4)}{usesPercentage ? '%' : ''}</td>
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
        <p>O intervalo de confiança de 95% indica que há 95% de probabilidade de que a verdadeira {currentPage === 1 ? 'média' : currentPage === 2 ? 'taxa de presença' : currentPage === 3 ? 'taxa de uso' : currentPage === 4 ? 'média de apoio' : 'taxa de conclusão'} esteja dentro deste intervalo. Quanto menor o intervalo, maior a precisão da estimativa.</p>
      </div>
    </div>
  </section>
  {/if}

  <!-- Página 6: Dashboard Individual -->
  {#if currentPage === 6}
  <section class="dashboard-section">
    <h2>🏫 Selecione uma Escola para Análise Individual</h2>
    <div class="school-selector">
      <select on:change={(e) => selectSchoolForDashboard(e.target.value)}>
        <option value="">Selecione uma escola...</option>
        {#each allSchoolsData as school}
          <option value={school.name} selected={selectedSchoolDashboard?.name === school.name}>{school.name}</option>
        {/each}
      </select>
    </div>
    
    {#if selectedSchoolDashboard}
    <div class="school-header">
      <h3>{selectedSchoolDashboard.name}</h3>
      <div class="school-info">
        <span class="badge-info">{selectedSchoolDashboard.tipo}</span>
        <span class="badge-info">{selectedSchoolDashboard.turno}</span>
        <span class="badge-info">{selectedSchoolDashboard.alunos} alunos</span>
      </div>
    </div>
    
    <!-- Resumo dos 7 Indicadores -->
    <div class="indicators-summary">
      <div class="indicator-card" class:has-data={selectedSchoolDashboard.superBI}>
        <span class="indicator-icon">📊</span>
        <div class="indicator-info">
          <span class="indicator-name">SUPER BI</span>
          {#if selectedSchoolDashboard.superBI}
            <span class="indicator-value">{selectedSchoolDashboard.superBI.monteCarloMean.toFixed(2)}</span>
            <span class="indicator-scale">escala 0-10</span>
          {:else}
            <span class="indicator-na">Sem dados</span>
          {/if}
        </div>
      </div>
      
      <div class="indicator-card" class:has-data={selectedSchoolDashboard.alunoPresente}>
        <span class="indicator-icon">👥</span>
        <div class="indicator-info">
          <span class="indicator-name">Aluno Presente</span>
          {#if selectedSchoolDashboard.alunoPresente}
            <span class="indicator-value">{selectedSchoolDashboard.alunoPresente.monteCarloMean.toFixed(2)}%</span>
            <span class="indicator-scale">presença</span>
          {:else}
            <span class="indicator-na">Sem dados</span>
          {/if}
        </div>
      </div>
      
      <div class="indicator-card" class:has-data={selectedSchoolDashboard.biPlataformas}>
        <span class="indicator-icon">💻</span>
        <div class="indicator-info">
          <span class="indicator-name">BI Plataformas</span>
          {#if selectedSchoolDashboard.biPlataformas}
            <span class="indicator-value">{selectedSchoolDashboard.biPlataformas.monteCarloMean.toFixed(2)}%</span>
            <span class="indicator-scale">uso plataformas</span>
          {:else}
            <span class="indicator-na">Sem dados</span>
          {/if}
        </div>
      </div>
      
      <div class="indicator-card" class:has-data={selectedSchoolDashboard.apoioPresencial}>
        <span class="indicator-icon">🤝</span>
        <div class="indicator-info">
          <span class="indicator-name">Apoio Presencial</span>
          {#if selectedSchoolDashboard.apoioPresencial}
            <span class="indicator-value">{selectedSchoolDashboard.apoioPresencial.monteCarloMean.toFixed(2)}</span>
            <span class="indicator-scale">média apoio</span>
          {:else}
            <span class="indicator-na">Sem dados</span>
          {/if}
        </div>
      </div>
      
      <div class="indicator-card" class:has-data={selectedSchoolDashboard.tarefas}>
        <span class="indicator-icon">📝</span>
        <div class="indicator-info">
          <span class="indicator-name">Tarefas</span>
          {#if selectedSchoolDashboard.tarefas}
            <span class="indicator-value">{selectedSchoolDashboard.tarefas.monteCarloMean.toFixed(2)}%</span>
            <span class="indicator-scale">conclusão</span>
          {:else}
            <span class="indicator-na">Sem dados</span>
          {/if}
        </div>
      </div>
      
      <div class="indicator-card" class:has-data={selectedSchoolDashboard.biRedacao}>
        <span class="indicator-icon">✍️</span>
        <div class="indicator-info">
          <span class="indicator-name">BI Redação</span>
          {#if selectedSchoolDashboard.biRedacao}
            <span class="indicator-value">{selectedSchoolDashboard.biRedacao.monteCarloMean.toFixed(2)}%</span>
            <span class="indicator-scale">índice redação</span>
          {:else}
            <span class="indicator-na">Sem dados</span>
          {/if}
        </div>
      </div>
      
      <div class="indicator-card" class:has-data={selectedSchoolDashboard.khanAcademy}>
        <span class="indicator-icon">🎓</span>
        <div class="indicator-info">
          <span class="indicator-name">Khan Academy</span>
          {#if selectedSchoolDashboard.khanAcademy}
            <span class="indicator-value">{selectedSchoolDashboard.khanAcademy.monteCarloMean.toFixed(2)}%</span>
            <span class="indicator-scale">uso Khan</span>
          {:else}
            <span class="indicator-na">Sem dados</span>
          {/if}
        </div>
      </div>
      
      <div class="indicator-card" class:has-data={selectedSchoolDashboard.alura}>
        <span class="indicator-icon">🖥️</span>
        <div class="indicator-info">
          <span class="indicator-name">Alura</span>
          {#if selectedSchoolDashboard.alura}
            <span class="indicator-value">{selectedSchoolDashboard.alura.monteCarloMean.toFixed(2)}</span>
            <span class="indicator-scale">uso Alura</span>
          {:else}
            <span class="indicator-na">Sem dados</span>
          {/if}
        </div>
      </div>
      
      <div class="indicator-card" class:has-data={selectedSchoolDashboard.matific}>
        <span class="indicator-icon">🔢</span>
        <div class="indicator-info">
          <span class="indicator-name">Matific</span>
          {#if selectedSchoolDashboard.matific}
            <span class="indicator-value">{selectedSchoolDashboard.matific.monteCarloMean.toFixed(2)}%</span>
            <span class="indicator-scale">uso Matific</span>
          {:else}
            <span class="indicator-na">Sem dados</span>
          {/if}
        </div>
      </div>
      
      <div class="indicator-card" class:has-data={selectedSchoolDashboard.speak}>
        <span class="indicator-icon">🗣️</span>
        <div class="indicator-info">
          <span class="indicator-name">Speak</span>
          {#if selectedSchoolDashboard.speak}
            <span class="indicator-value">{selectedSchoolDashboard.speak.monteCarloMean.toFixed(2)}%</span>
            <span class="indicator-scale">uso Speak</span>
          {:else}
            <span class="indicator-na">Sem dados</span>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Gráficos -->
    <div class="dashboard-charts">
      <div class="chart-wrapper radar">
        <canvas bind:this={radarChartCanvas}></canvas>
      </div>
      <div class="chart-wrapper evolution">
        <canvas bind:this={evolutionChartCanvas}></canvas>
      </div>
    </div>
    
    <div class="dashboard-charts single">
      <div class="chart-wrapper comparison">
        <canvas bind:this={comparisonChartCanvas}></canvas>
      </div>
    </div>
    
    <!-- Tabela Detalhada por Bimestre -->
    <div class="detail-tables">
      <h3>📋 Dados Detalhados por Bimestre</h3>
      <div class="table-container">
        <table class="detail-table">
          <thead>
            <tr>
              <th>Indicador</th>
              <th>1º Bim</th>
              <th>2º Bim</th>
              <th>3º Bim</th>
              <th>4º Bim</th>
              <th>Média MC</th>
              <th>IC 95%</th>
            </tr>
          </thead>
          <tbody>
            {#if selectedSchoolDashboard.superBI}
            <tr>
              <td>📊 SUPER BI</td>
              <td>{selectedSchoolDashboard.superBI.bimestres.b1.toFixed(2)}</td>
              <td>{selectedSchoolDashboard.superBI.bimestres.b2.toFixed(2)}</td>
              <td>{selectedSchoolDashboard.superBI.bimestres.b3.toFixed(2)}</td>
              <td>{selectedSchoolDashboard.superBI.bimestres.b4.toFixed(2)}</td>
              <td class="highlight">{selectedSchoolDashboard.superBI.monteCarloMean.toFixed(4)}</td>
              <td>[{selectedSchoolDashboard.superBI.confidenceInterval.lower.toFixed(2)} - {selectedSchoolDashboard.superBI.confidenceInterval.upper.toFixed(2)}]</td>
            </tr>
            {/if}
            {#if selectedSchoolDashboard.alunoPresente}
            <tr>
              <td>👥 Aluno Presente</td>
              <td>{selectedSchoolDashboard.alunoPresente.bimestres.b1.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.alunoPresente.bimestres.b2.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.alunoPresente.bimestres.b3.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.alunoPresente.bimestres.b4.toFixed(2)}%</td>
              <td class="highlight">{selectedSchoolDashboard.alunoPresente.monteCarloMean.toFixed(4)}%</td>
              <td>[{selectedSchoolDashboard.alunoPresente.confidenceInterval.lower.toFixed(2)} - {selectedSchoolDashboard.alunoPresente.confidenceInterval.upper.toFixed(2)}]</td>
            </tr>
            {/if}
            {#if selectedSchoolDashboard.biPlataformas}
            <tr>
              <td>💻 BI Plataformas</td>
              <td>{selectedSchoolDashboard.biPlataformas.bimestres.b1.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.biPlataformas.bimestres.b2.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.biPlataformas.bimestres.b3.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.biPlataformas.bimestres.b4.toFixed(2)}%</td>
              <td class="highlight">{selectedSchoolDashboard.biPlataformas.monteCarloMean.toFixed(4)}%</td>
              <td>[{selectedSchoolDashboard.biPlataformas.confidenceInterval.lower.toFixed(2)} - {selectedSchoolDashboard.biPlataformas.confidenceInterval.upper.toFixed(2)}]</td>
            </tr>
            {/if}
            {#if selectedSchoolDashboard.apoioPresencial}
            <tr>
              <td>🤝 Apoio Presencial</td>
              <td>{selectedSchoolDashboard.apoioPresencial.bimestres.b1.toFixed(2)}</td>
              <td>{selectedSchoolDashboard.apoioPresencial.bimestres.b2.toFixed(2)}</td>
              <td>{selectedSchoolDashboard.apoioPresencial.bimestres.b3.toFixed(2)}</td>
              <td>{selectedSchoolDashboard.apoioPresencial.bimestres.b4.toFixed(2)}</td>
              <td class="highlight">{selectedSchoolDashboard.apoioPresencial.monteCarloMean.toFixed(4)}</td>
              <td>[{selectedSchoolDashboard.apoioPresencial.confidenceInterval.lower.toFixed(2)} - {selectedSchoolDashboard.apoioPresencial.confidenceInterval.upper.toFixed(2)}]</td>
            </tr>
            {/if}
            {#if selectedSchoolDashboard.tarefas}
            <tr>
              <td>📝 Tarefas</td>
              <td>{selectedSchoolDashboard.tarefas.bimestres.b1.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.tarefas.bimestres.b2.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.tarefas.bimestres.b3.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.tarefas.bimestres.b4.toFixed(2)}%</td>
              <td class="highlight">{selectedSchoolDashboard.tarefas.monteCarloMean.toFixed(4)}%</td>
              <td>[{selectedSchoolDashboard.tarefas.confidenceInterval.lower.toFixed(2)} - {selectedSchoolDashboard.tarefas.confidenceInterval.upper.toFixed(2)}]</td>
            </tr>
            {/if}
            {#if selectedSchoolDashboard.biRedacao}
            <tr>
              <td>✍️ BI Redação</td>
              <td>{selectedSchoolDashboard.biRedacao.bimestres.b1.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.biRedacao.bimestres.b2.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.biRedacao.bimestres.b3.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.biRedacao.bimestres.b4.toFixed(2)}%</td>
              <td class="highlight">{selectedSchoolDashboard.biRedacao.monteCarloMean.toFixed(4)}%</td>
              <td>[{selectedSchoolDashboard.biRedacao.confidenceInterval.lower.toFixed(2)} - {selectedSchoolDashboard.biRedacao.confidenceInterval.upper.toFixed(2)}]</td>
            </tr>
            {/if}
            {#if selectedSchoolDashboard.khanAcademy}
            <tr>
              <td>🎓 Khan Academy</td>
              <td>{selectedSchoolDashboard.khanAcademy.bimestres.b1.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.khanAcademy.bimestres.b2.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.khanAcademy.bimestres.b3.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.khanAcademy.bimestres.b4.toFixed(2)}%</td>
              <td class="highlight">{selectedSchoolDashboard.khanAcademy.monteCarloMean.toFixed(4)}%</td>
              <td>[{selectedSchoolDashboard.khanAcademy.confidenceInterval.lower.toFixed(2)} - {selectedSchoolDashboard.khanAcademy.confidenceInterval.upper.toFixed(2)}]</td>
            </tr>
            {/if}
            {#if selectedSchoolDashboard.alura}
            <tr>
              <td>🖥️ Alura</td>
              <td>{selectedSchoolDashboard.alura.bimestres.b1.toFixed(2)}</td>
              <td>{selectedSchoolDashboard.alura.bimestres.b2.toFixed(2)}</td>
              <td>{selectedSchoolDashboard.alura.bimestres.b3.toFixed(2)}</td>
              <td>{selectedSchoolDashboard.alura.bimestres.b4.toFixed(2)}</td>
              <td class="highlight">{selectedSchoolDashboard.alura.monteCarloMean.toFixed(4)}</td>
              <td>[{selectedSchoolDashboard.alura.confidenceInterval.lower.toFixed(2)} - {selectedSchoolDashboard.alura.confidenceInterval.upper.toFixed(2)}]</td>
            </tr>
            {/if}
            {#if selectedSchoolDashboard.matific}
            <tr>
              <td>🔢 Matific</td>
              <td>{selectedSchoolDashboard.matific.bimestres.b1.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.matific.bimestres.b2.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.matific.bimestres.b3.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.matific.bimestres.b4.toFixed(2)}%</td>
              <td class="highlight">{selectedSchoolDashboard.matific.monteCarloMean.toFixed(4)}%</td>
              <td>[{selectedSchoolDashboard.matific.confidenceInterval.lower.toFixed(2)} - {selectedSchoolDashboard.matific.confidenceInterval.upper.toFixed(2)}]</td>
            </tr>
            {/if}
            {#if selectedSchoolDashboard.speak}
            <tr>
              <td>🗣️ Speak</td>
              <td>{selectedSchoolDashboard.speak.bimestres.b1.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.speak.bimestres.b2.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.speak.bimestres.b3.toFixed(2)}%</td>
              <td>{selectedSchoolDashboard.speak.bimestres.b4.toFixed(2)}%</td>
              <td class="highlight">{selectedSchoolDashboard.speak.monteCarloMean.toFixed(4)}%</td>
              <td>[{selectedSchoolDashboard.speak.confidenceInterval.lower.toFixed(2)} - {selectedSchoolDashboard.speak.confidenceInterval.upper.toFixed(2)}]</td>
            </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>
    {/if}
  </section>
  {/if}

  {#if showCalculation && selectedSchool}
    <div class="modal-overlay" on:click={closeModal} on:keydown={(e) => e.key === 'Escape' && closeModal()} role="button" tabindex="0">
      <div class="modal" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true">
        <button class="close-btn" on:click={closeModal}>×</button>
        <h2>🔬 Detalhes do Cálculo Monte Carlo</h2>
        <h3>{selectedSchool.name}</h3>
        
        <div class="calc-details">
          <div class="calc-section">
            <h4>📥 Dados de Entrada ({metricLabel}{usesPercentage ? ' %' : ''} Bimestrais)</h4>
            <div class="data-grid">
              <div class="data-item">
                <span class="label">1º Bimestre:</span>
                <span class="value">{selectedSchool.bimestres.b1}{usesPercentage ? '%' : ''}</span>
              </div>
              <div class="data-item">
                <span class="label">2º Bimestre:</span>
                <span class="value">{selectedSchool.bimestres.b2}{usesPercentage ? '%' : ''}</span>
              </div>
              <div class="data-item">
                <span class="label">3º Bimestre:</span>
                <span class="value">{selectedSchool.bimestres.b3.toFixed(2)}{usesPercentage ? '%' : ''}</span>
              </div>
              <div class="data-item">
                <span class="label">4º Bimestre:</span>
                <span class="value">{selectedSchool.bimestres.b4}{usesPercentage ? '%' : ''}</span>
              </div>
            </div>
          </div>

          <div class="calc-section">
            <h4>🧮 Fórmula da Média Simples</h4>
            <div class="formula">
              <code>Média = (B1 + B2 + B3 + B4) / 4</code>
              <code>Média = ({selectedSchool.bimestres.b1} + {selectedSchool.bimestres.b2} + {selectedSchool.bimestres.b3.toFixed(2)} + {selectedSchool.bimestres.b4}) / 4</code>
              <code class="result">Média Simples = {selectedSchool.simpleMean.toFixed(4)}{usesPercentage ? '%' : ''}</code>
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
                  <li>Limita valores entre 0 e {maxScale}</li>
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
                <span class="label">{metricLabel} Simples:</span>
                <span class="value">{selectedSchool.simpleMean.toFixed(4)}{usesPercentage ? '%' : ''}</span>
              </div>
              <div class="result-item highlight">
                <span class="label">{metricLabel} Monte Carlo:</span>
                <span class="value">{selectedSchool.monteCarloMean.toFixed(4)}{usesPercentage ? '%' : ''}</span>
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
              A diferença mínima entre a {metricLabel.toLowerCase()} simples e Monte Carlo confirma a consistência do cálculo.
            </p>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <footer>
    <p>© 2025 Análise REGINA - Desenvolvido com Svelte + Chart.js + Monte Carlo</p>
    <p class="footer-note">Dados processados com {calculationResults.length > 0 ? '10.000' : '0'} iterações de simulação por escola</p>
    <div class="creator-info">
      <p class="creator-name">👨‍🏫 Criado por: Profº Davi Antonino Nunes da Silva</p>
      <p class="creator-contact">📧 E-mails: davi.silva@educacao.sp.gov.br | professordavi85@gmail.com</p>
      <p class="creator-contact">📱 WhatsApp: (16) 99260-4315</p>
    </div>
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

  /* Estilos para páginas 4, 5 e 6 */
  header.page4 {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    box-shadow: 0 10px 40px rgba(240, 147, 251, 0.3);
  }

  header.page5 {
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    box-shadow: 0 10px 40px rgba(255, 215, 0, 0.3);
  }

  header.page6 {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
  }

  header.page7 {
    background: linear-gradient(135deg, #e91e63 0%, #9c27b0 100%);
    box-shadow: 0 10px 40px rgba(233, 30, 99, 0.3);
  }

  header.page8 {
    background: linear-gradient(135deg, #14bf96 0%, #00695c 100%);
    box-shadow: 0 10px 40px rgba(20, 191, 150, 0.3);
  }

  header.page9 {
    background: linear-gradient(135deg, #9B59B6 0%, #3498DB 100%);
    box-shadow: 0 10px 40px rgba(155, 89, 182, 0.3);
  }

  header.page10 {
    background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%);
    box-shadow: 0 10px 40px rgba(231, 76, 60, 0.3);
  }

  header.page11 {
    background: linear-gradient(135deg, #3498DB 0%, #2980B9 100%);
    box-shadow: 0 10px 40px rgba(52, 152, 219, 0.3);
  }

  .nav-btn.dashboard-btn {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(240, 147, 251, 0.3) 100%);
    border-color: #667eea;
  }

  .nav-btn.dashboard-btn.active {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
    border-color: transparent;
    box-shadow: 0 5px 25px rgba(102, 126, 234, 0.5);
  }

  /* Aviso de duplo clique */
  .warning-notice {
    text-align: center;
    padding: 15px 20px;
    margin-bottom: 20px;
    background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
    border-radius: 15px;
    font-weight: 700;
    font-size: 1.1rem;
    color: #1a1a2e;
    animation: pulse 2s infinite;
    box-shadow: 0 5px 20px rgba(255, 107, 107, 0.4);
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.02); opacity: 0.9; }
  }

  /* Credenciais do criador */
  .creator-info {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .creator-name {
    font-size: 1.1rem;
    font-weight: 600;
    color: #667eea;
    margin-bottom: 8px;
  }

  .creator-contact {
    font-size: 0.9rem;
    opacity: 0.9;
    margin: 5px 0;
  }

  /* Dashboard Individual - Página 6 */
  .dashboard-section {
    background: rgba(255, 255, 255, 0.05);
    padding: 30px;
    border-radius: 20px;
    margin-bottom: 30px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .school-selector {
    margin: 20px 0;
  }

  .school-selector select {
    width: 100%;
    max-width: 500px;
    padding: 15px 20px;
    font-size: 1.1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 15px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    cursor: pointer;
    backdrop-filter: blur(10px);
  }

  .school-selector select option {
    background: #1a1a2e;
    color: #fff;
  }

  .school-header {
    text-align: center;
    padding: 20px;
    margin-bottom: 30px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
    border-radius: 15px;
    border: 1px solid rgba(102, 126, 234, 0.3);
  }

  .school-header h3 {
    font-size: 1.5rem;
    margin-bottom: 10px;
  }

  .school-info {
    display: flex;
    justify-content: center;
    gap: 15px;
    flex-wrap: wrap;
  }

  .badge-info {
    padding: 8px 15px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    font-size: 0.9rem;
  }

  .indicators-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 15px;
    margin-bottom: 30px;
  }

  .indicator-card {
    background: rgba(255, 255, 255, 0.05);
    padding: 20px;
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
    transition: all 0.3s ease;
    opacity: 0.5;
  }

  .indicator-card.has-data {
    opacity: 1;
    border-color: rgba(102, 126, 234, 0.3);
  }

  .indicator-card.has-data:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.3);
  }

  .indicator-icon {
    font-size: 2rem;
    display: block;
    margin-bottom: 10px;
  }

  .indicator-info {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .indicator-name {
    font-size: 0.85rem;
    opacity: 0.8;
  }

  .indicator-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #667eea;
  }

  .indicator-scale {
    font-size: 0.75rem;
    opacity: 0.6;
  }

  .indicator-na {
    color: #999;
    font-style: italic;
  }

  .dashboard-charts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }

  .dashboard-charts.single {
    grid-template-columns: 1fr;
  }

  .chart-wrapper {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 15px;
    padding: 20px;
    min-height: 350px;
  }

  .chart-wrapper.radar {
    min-height: 400px;
  }

  .chart-wrapper.evolution {
    min-height: 350px;
  }

  .chart-wrapper.comparison {
    min-height: 350px;
    max-width: 900px;
    margin: 0 auto;
  }

  .detail-tables {
    margin-top: 30px;
  }

  .detail-tables h3 {
    margin-bottom: 20px;
  }

  .detail-table {
    width: 100%;
    border-collapse: collapse;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 15px;
    overflow: hidden;
  }

  .detail-table th,
  .detail-table td {
    padding: 12px 15px;
    text-align: center;
    color: #333;
    border-bottom: 1px solid #eee;
  }

  .detail-table th {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    font-weight: 600;
  }

  .detail-table td:first-child {
    text-align: left;
    font-weight: 500;
  }

  .detail-table td.highlight {
    font-weight: 700;
    color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 1.8rem;
    }

    .subtitle {
      font-size: 1rem;
    }

    .nav-btn {
      padding: 10px 15px;
      font-size: 0.85rem;
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

    .dashboard-charts {
      grid-template-columns: 1fr;
    }

    .indicators-summary {
      grid-template-columns: repeat(2, 1fr);
    }

    .indicator-card {
      padding: 15px;
    }

    .indicator-value {
      font-size: 1.2rem;
    }
  }
</style>
