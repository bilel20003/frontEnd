import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.css']
})
export class StatisticsComponent implements OnInit {
  chart: any;

  // Données pour le graphique
  totalClaims: number = 250;
  resolvedClaims: number = 150;
  ongoingClaims: number = 80;
  rejectedClaims: number = 20;
  
  // Données pour le graphique à secteurs
  statusData: number[] = [80, 30, 10]; // Exemple de répartition par statut
  statusLabels: string[] = ['Résolu', 'En Cours', 'Refusé'];

  // Données pour le graphique à barres
  ministryData = [
    { name: 'Ministère A', value: 100 },
    { name: 'Ministère B', value: 80 },
    { name: 'Ministère C', value: 70 }
  ];

  ngOnInit(): void {
    this.createPieChart();
    this.createBarChart();
  }

  // Création du graphique à secteurs
  createPieChart(): void {
    this.chart = new Chart('pieChart', {
      type: 'pie',  // Type de graphique
      data: {
        labels: this.statusLabels,
        datasets: [{
          data: this.statusData,
          backgroundColor: ['#FF5733', '#FFBD33', '#33FF57'],
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                return `${context.label}: ${context.raw}%`;
              }
            }
          }
        }
      }
    });
  }

  // Création du graphique à barres
  createBarChart(): void {
    const barChart = new Chart('barChart', {
      type: 'bar',  // Type de graphique
      data: {
        labels: this.ministryData.map(ministry => ministry.name),
        datasets: [{
          label: 'Réclamations par Ministère',
          data: this.ministryData.map(ministry => ministry.value),
          backgroundColor: '#FFBD33',
          borderColor: '#FF5733',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
}
