import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-statistic',
  templateUrl: './statistic.component.html',
  styleUrls: ['./statistic.component.css']
})
export class StatisticsComponent implements OnInit {
  totalClaims = 120;
  resolvedClaims = 80;
  ongoingClaims = 30;
  rejectedClaims = 10;
  
  statusData = [
    { name: 'Résolu', value: 80 },
    { name: 'En Cours', value: 30 },
    { name: 'Refusé', value: 10 }
  ];

  ministryData = [
    { name: 'Ministère 1', value: 50 },
    { name: 'Ministère 2', value: 30 },
    { name: 'Ministère 3', value: 40 },
  ];

  claims = [
    { id: 1, date: '2025-04-01', ministry: 'Ministère 1', status: 'Résolu' },
    { id: 2, date: '2025-04-02', ministry: 'Ministère 2', status: 'En Cours' },
    { id: 3, date: '2025-04-03', ministry: 'Ministère 3', status: 'Refusé' }
  ];

  constructor() {}

  ngOnInit(): void {}
}
