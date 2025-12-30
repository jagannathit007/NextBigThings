// webinar.service.ts

import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { ApiManager } from '../core/utilities/api-manager';
import { AppStorage } from '../core/utilities/app-storage';
import { common } from '../core/constants/common';
import { apiEndpoints } from '../core/constants/api-endpoints';
import { swalHelper } from '../core/constants/swal-helper';
import { 
  Webinar, 
  WebinarResponse, 
  CreateWebinarData, 
  UpdateWebinarData,
  RegistrationResponse 
} from '../interface/webinar.interface';

@Injectable({
  providedIn: 'root',
})
export class WebinarService {
  private headers: any[] = [];

  constructor(private apiManager: ApiManager, private storage: AppStorage) {}

  private getHeaders = () => {
    this.headers = [];
    const token = this.storage.get(common.TOKEN);
    if (token) {
      this.headers.push({ Authorization: `Bearer ${token}` });
    }
  };

  // 1. Create Webinar
  async createWebinar(data: CreateWebinarData, thumbnail?: File): Promise<any> {
    try {
      this.getHeaders();
      const formData = new FormData();
      
      // Append all data fields
      Object.keys(data).forEach(key => {
        if (data[key as keyof CreateWebinarData] !== undefined) {
          formData.append(key, data[key as keyof CreateWebinarData] as string);
        }
      });
      
      // Append thumbnail if provided
      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }

      const response = await this.apiManager.request(
        {
          url: apiEndpoints.CREATE_WEBINAR,
          method: 'POST',
        },
        formData,
        this.headers
      );
      
      return response;
    } catch (error) {
      console.error('Create Webinar Error:', error);
      throw error;
    }
  }

  // 2. Get All Webinars (Paginated with filters)
  async getAllWebinars(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    accessType?: string;
    modeType?: string;
  }): Promise<WebinarResponse> {
    try {
      this.getHeaders();
      
      let queryParams = new HttpParams();
      if (params.page) queryParams = queryParams.set('page', params.page.toString());
      if (params.limit) queryParams = queryParams.set('limit', params.limit.toString());
      if (params.search) queryParams = queryParams.set('search', params.search);
      if (params.status) queryParams = queryParams.set('status', params.status);
      if (params.accessType) queryParams = queryParams.set('accessType', params.accessType);
      if (params.modeType) queryParams = queryParams.set('modeType', params.modeType);

      const response = await this.apiManager.request(
        {
          url: `${apiEndpoints.GET_ALL_WEBINARS}?${queryParams.toString()}`,
          method: 'GET',
        },
        null,
        this.headers
      );
      
      return response.data || response;
    } catch (error) {
      console.error('Get Webinars Error:', error);
      swalHelper.showToast('Failed to fetch webinars', 'error');
      throw error;
    }
  }

  // 3. Get Webinar by ID
  async getWebinarById(webinarId: string): Promise<any> {
    try {
      this.getHeaders();
      
      const response = await this.apiManager.request(
        {
          url: apiEndpoints.GET_WEBINAR,
          method: 'POST',
        },
        { webinarId },
        this.headers
      );
      
      return response;
    } catch (error) {
      console.error('Get Webinar By ID Error:', error);
      swalHelper.showToast('Failed to fetch webinar details', 'error');
      throw error;
    }
  }

  // 4. Update Webinar
  async updateWebinar(data: UpdateWebinarData, thumbnail?: File): Promise<any> {
    try {
      this.getHeaders();
      const formData = new FormData();
      
      // Append all data fields
      Object.keys(data).forEach(key => {
        if (data[key as keyof UpdateWebinarData] !== undefined) {
          formData.append(key, data[key as keyof UpdateWebinarData] as string);
        }
      });
      
      // Append thumbnail if provided
      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }

      const response = await this.apiManager.request(
        {
          url: apiEndpoints.UPDATE_WEBINAR,
          method: 'POST',
        },
        formData,
        this.headers
      );
      
      return response;
    } catch (error) {
      console.error('Update Webinar Error:', error);
      throw error;
    }
  }

  // 5. Delete Webinar
  async deleteWebinar(webinarId: string): Promise<any> {
    try {
      this.getHeaders();
      
      const response = await this.apiManager.request(
        {
          url: apiEndpoints.DELETE_WEBINAR,
          method: 'POST',
        },
        { webinarId },
        this.headers
      );
      
      swalHelper.showToast('Webinar deleted successfully', 'success');
      return response;
    } catch (error) {
      console.error('Delete Webinar Error:', error);
      swalHelper.showToast('Failed to delete webinar', 'error');
      throw error;
    }
  }

  // 6. Get Registered Users
  async getRegisteredUsers(params: {
    webinarId: string;
    page?: number;
    limit?: number;
    approvalStatus?: string;
  }): Promise<RegistrationResponse> {
    try {
      this.getHeaders();
      
      let queryParams = new HttpParams();
      if (params.page) queryParams = queryParams.set('page', params.page.toString());
      if (params.limit) queryParams = queryParams.set('limit', params.limit.toString());
      if (params.approvalStatus) queryParams = queryParams.set('approvalStatus', params.approvalStatus);

      const response = await this.apiManager.request(
        {
          url: `${apiEndpoints.GET_REGISTERED_USERS}?${queryParams.toString()}`,
          method: 'POST',
        },
        { webinarId: params.webinarId },
        this.headers
      );
      
      return response.data || response;
    } catch (error) {
      console.error('Get Registered Users Error:', error);
      swalHelper.showToast('Failed to fetch registered users', 'error');
      throw error;
    }
  }

  // 7. Get Video Requests
  async getVideoRequests(params: {
    webinarId: string;
    status?: string;
  }): Promise<any> {
    try {
      this.getHeaders();
      
      let queryParams = new HttpParams();
      if (params.status) queryParams = queryParams.set('status', params.status);

      const response = await this.apiManager.request(
        {
          url: `${apiEndpoints.GET_VIDEO_REQUESTS}?${queryParams.toString()}`,
          method: 'POST',
        },
        { webinarId: params.webinarId },
        this.headers
      );
      
      return response;
    } catch (error) {
      console.error('Get Video Requests Error:', error);
      swalHelper.showToast('Failed to fetch video requests', 'error');
      throw error;
    }
  }

  // 8. Upload Webinar Video
  async uploadWebinarVideo(webinarId: string, webinarVideoUrl: string): Promise<any> {
    try {
      this.getHeaders();
      
      const response = await this.apiManager.request(
        {
          url: apiEndpoints.UPLOAD_WEBINAR_VIDEO,
          method: 'POST',
        },
        { webinarId, webinarVideoUrl },
        this.headers
      );
      
      swalHelper.showToast('Webinar video uploaded successfully', 'success');
      return response;
    } catch (error) {
      console.error('Upload Webinar Video Error:', error);
      swalHelper.showToast('Failed to upload webinar video', 'error');
      throw error;
    }
  }

  // 9. Approve/Reject Registration
  async approveRegistration(registrationId: string, action: 'approve' | 'reject', adminId?: string): Promise<any> {
    try {
      this.getHeaders();
      
      const payload: any = { registrationId, action };
      if (adminId) {
        payload.adminId = adminId;
      }
      
      const response = await this.apiManager.request(
        {
          url: apiEndpoints.APPROVE_REGISTRATION,
          method: 'POST',
        },
        payload,
        this.headers
      );
      
      swalHelper.showToast(`Registration ${action}d successfully`, 'success');
      return response;
    } catch (error) {
      console.error('Approve Registration Error:', error);
      swalHelper.showToast(`Failed to ${action} registration`, 'error');
      throw error;
    }
  }

  // 10. Approve/Reject Video Request
  async approveVideoRequest(webinarId: string, requestId: string, action: 'approve' | 'reject', adminId?: string): Promise<any> {
    try {
      this.getHeaders();
      
      const payload: any = { webinarId, requestId, action };
      if (adminId) {
        payload.adminId = adminId;
      }
      
      const response = await this.apiManager.request(
        {
          url: apiEndpoints.APPROVE_VIDEO_REQUEST,
          method: 'POST',
        },
        payload,
        this.headers
      );
      
      swalHelper.showToast(`Video request ${action}d successfully`, 'success');
      return response;
    } catch (error) {
      console.error('Approve Video Request Error:', error);
      swalHelper.showToast(`Failed to ${action} video request`, 'error');
      throw error;
    }
  }
}