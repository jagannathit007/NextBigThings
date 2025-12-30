import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ApiManager } from '../core/utilities/api-manager';
import { AppStorage } from '../core/utilities/app-storage';
import { common } from '../core/constants/common';
import { apiEndpoints } from '../core/constants/api-endpoints';
import { swalHelper } from '../core/constants/swal-helper';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private headers: any[] = [];

  constructor(private apiManager: ApiManager, private storage: AppStorage) {}

  private getHeaders = () => {
    this.headers = [];
    const token = this.storage.get(common.TOKEN);
    if (token) {
      this.headers.push({ Authorization: `Bearer ${token}` });
    }
  };

  async getDashboardAnalytics(startDate?: string, endDate?: string): Promise<any> {
    try {
      this.getHeaders();
      
      let queryParams = new HttpParams();
      
      if (startDate) {
        queryParams = queryParams.set('startDate', startDate);
      }
      
      if (endDate) {
        queryParams = queryParams.set('endDate', endDate);
      }

      const response = await this.apiManager.request(
        {
          url: `${apiEndpoints.GET_DASHBOARD_ANALYTICS}?${queryParams.toString()}`,
          method: 'GET',
        },
        null,
        this.headers
      );
      
      return response;
    } catch (error) {
      console.error('Get Dashboard Analytics Error:', error);
      swalHelper.showToast('Failed to fetch analytics', 'error');
      throw error;
    }
  }
}