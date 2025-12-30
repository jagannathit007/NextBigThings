import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../../services/analytics.service';
import { swalHelper } from '../../../core/constants/swal-helper';

interface WebinarRegistration {
  webinarId: string;
  webinarTitle: string;
  registrationCount: number;
}

interface AnalyticsData {
  totalUsers: number;
  newUsers: number;
  totalWebinars: number;
  newWebinars: number;
  totalEvents: number;
  newEvents: number;
  totalRegistrations: number;
  newRegistrations: number;
  registrationsPerWebinar: WebinarRegistration[];
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [AnalyticsService],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
})
export class AnalyticsComponent implements OnInit {
  analytics: AnalyticsData = {
    totalUsers: 0,
    newUsers: 0,
    totalWebinars: 0,
    newWebinars: 0,
    totalEvents: 0,
    newEvents: 0,
    totalRegistrations: 0,
    newRegistrations: 0,
    registrationsPerWebinar: []
  };

  loading: boolean = false;
  startDate: string = '';
  endDate: string = '';
  searchQuery: string = '';
  filteredWebinars: WebinarRegistration[] = [];
  maxRegistrations: number = 0;

  Math = Math;

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  async loadAnalytics(): Promise<void> {
    this.loading = true;
    try {
      const response = await this.analyticsService.getDashboardAnalytics(
        this.startDate, 
        this.endDate
      );
      
      this.analytics = response.data;
      this.filteredWebinars = [...this.analytics.registrationsPerWebinar];
      
      // Calculate max registrations for bar width calculation
      this.maxRegistrations = Math.max(
        ...this.analytics.registrationsPerWebinar.map(w => w.registrationCount),
        1
      );
      
    } catch (error) {
      console.error('Error loading analytics:', error);
      swalHelper.showToast('Failed to load analytics', 'error');
    } finally {
      this.loading = false;
    }
  }

  onDateChange(): void {
    if (this.startDate && this.endDate) {
      // Validate dates
      if (new Date(this.startDate) > new Date(this.endDate)) {
        swalHelper.showToast('Start date cannot be after end date', 'error');
        return;
      }
      this.loadAnalytics();
    }
  }

  clearDates(): void {
    this.startDate = '';
    this.endDate = '';
    this.loadAnalytics();
  }

  refreshData(): void {
    this.loadAnalytics();
  }

  filterWebinars(): void {
    if (!this.searchQuery.trim()) {
      this.filteredWebinars = [...this.analytics.registrationsPerWebinar];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredWebinars = this.analytics.registrationsPerWebinar.filter(
      webinar => webinar.webinarTitle.toLowerCase().includes(query)
    );
  }

  getBarWidth(count: number): number {
    if (this.maxRegistrations === 0) return 0;
    return Math.max((count / this.maxRegistrations) * 100, 5);
  }

  getPercentage(part: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
  }
}