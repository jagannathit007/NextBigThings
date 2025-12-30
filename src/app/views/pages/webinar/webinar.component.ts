import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { WebinarService } from '../../../services/webinar.service';
import { 
  Webinar, 
  WebinarResponse, 
  CreateWebinarData, 
  UpdateWebinarData,
  WebinarRegistration,
  RegistrationResponse,
  VideoRequest,
  VideoRequestsResponse
} from '../../../interface/webinar.interface';
import { AppStorage } from '../../../core/utilities/app-storage';
import { common } from '../../../core/constants/common';
import { swalHelper } from '../../../core/constants/swal-helper';
import { jwtDecode } from 'jwt-decode';
import { debounceTime, Subject } from 'rxjs';
import { environment } from 'src/env/env.local';

@Component({
  selector: 'app-webinar',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgxPaginationModule],
  providers: [WebinarService, AppStorage],
  templateUrl: './webinar.component.html',
  styleUrls: ['./webinar.component.scss'],
})
export class WebinarComponent implements OnInit {
  webinars: WebinarResponse = {
    docs: [],
    totalDocs: 0,
    limit: 10,
    page: 1,
    totalPages: 0,
    pagingCounter: 0,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null,
  };

  registrations: RegistrationResponse = {
    docs: [],
    totalDocs: 0,
    limit: 10,
    page: 1,
    totalPages: 0,
    pagingCounter: 0,
    hasPrevPage: false,
    hasNextPage: false,
    prevPage: null,
    nextPage: null,
  };

  videoRequests: VideoRequestsResponse = {
    webinarId: '',
    webinarTitle: '',
    totalRequests: 0,
    videoRequests: []
  };

  environment = environment;

  loading: boolean = false;
  showWebinarModal: boolean = false;
  showRegistrationsModal: boolean = false;
  showVideoRequestsModal: boolean = false;
  showUploadVideoModal: boolean = false;
  editMode: boolean = false;
  editingWebinarId: string | null = null;
  selectedWebinarId: string | null = null;
  modalLoading: boolean = false;
  webinarForm: FormGroup;
  adminId: string = '';
  adminName: string = '';
  formSubmitted: boolean = false;
  selectedThumbnail: File | null = null;
  previewThumbnail: string | null = null;
  videoUrl: string = '';

  Math = Math;

  filters = {
    page: 1,
    limit: 10,
    status: '' as string,
    accessType: '' as string,
    modeType: '' as string,
    search: '',
  };

  registrationFilters = {
    page: 1,
    limit: 10,
    approvalStatus: '' as string,
  };

  videoRequestFilters = {
    status: '' as string,
  };

  paginationConfig = {
    id: 'webinar-pagination',
  };

  registrationPaginationConfig = {
    id: 'registration-pagination',
  };

  private filterSubject = new Subject<void>();

  constructor(
    private webinarService: WebinarService,
    private storage: AppStorage,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.webinarForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      topic: ['', [Validators.maxLength(100)]],
      host: ['', Validators.required],
      date: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      modeType: ['online', Validators.required],
      address: [''],
      mapLink: [''],
      zoomLink: [''],
      zoomMeetingId: [''],
      zoomPasscode: [''],
      accessType: ['free', Validators.required],
      price: [0, [Validators.min(0)]],
      maxCapacity: [100, [Validators.required, Validators.min(1)]],
      status: ['scheduled']
    });

    // Watch modeType changes
    this.webinarForm.get('modeType')?.valueChanges.subscribe(value => {
      this.onModeTypeChange(value);
    });

    // Watch accessType changes
    this.webinarForm.get('accessType')?.valueChanges.subscribe(value => {
      this.onAccessTypeChange(value);
    });

    this.filterSubject.pipe(debounceTime(300)).subscribe(() => {
      this.fetchWebinars();
    });
  }

  ngOnInit(): void {
    const token = this.storage.get(common.TOKEN);
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.adminId = decoded._id || '';
        this.adminName = decoded.name || 'Administrator';
        this.webinarForm.patchValue({
          host: this.adminId,
        });
      } catch (error) {
        console.error('Error parsing token:', error);
        swalHelper.showToast('Failed to load admin data', 'error');
      }
    }
    this.fetchWebinars();
  }

  onModeTypeChange(value: string): void {
    const zoomLinkControl = this.webinarForm.get('zoomLink');
    const addressControl = this.webinarForm.get('address');

    if (value === 'online') {
      zoomLinkControl?.setValidators([Validators.required]);
      addressControl?.clearValidators();
    } else if (value === 'offline') {
      addressControl?.setValidators([Validators.required]);
      zoomLinkControl?.clearValidators();
    }

    zoomLinkControl?.updateValueAndValidity();
    addressControl?.updateValueAndValidity();
  }

  onAccessTypeChange(value: string): void {
    const priceControl = this.webinarForm.get('price');
    if (value === 'paid') {
      priceControl?.setValidators([Validators.required, Validators.min(1)]);
    } else {
      priceControl?.setValidators([Validators.min(0)]);
      priceControl?.setValue(0);
    }
    priceControl?.updateValueAndValidity();
  }

  async fetchWebinars(): Promise<void> {
    this.loading = true;
    try {
      const params: any = {
        page: this.filters.page,
        limit: this.filters.limit,
      };
      
      if (this.filters.search) params.search = this.filters.search;
      if (this.filters.status) params.status = this.filters.status;
      if (this.filters.accessType) params.accessType = this.filters.accessType;
      if (this.filters.modeType) params.modeType = this.filters.modeType;

      const response = await this.webinarService.getAllWebinars(params);
      this.webinars = response;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching webinars:', error);
      swalHelper.showToast('Failed to fetch webinars', 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  openWebinarModal(webinar?: Webinar): void {
    this.showWebinarModal = true;
    this.editMode = !!webinar;
    this.editingWebinarId = webinar?._id || null;
    this.formSubmitted = false;
    this.selectedThumbnail = null;
    this.previewThumbnail = null;

    if (webinar) {
      // Set existing thumbnail as preview in edit mode
      this.previewThumbnail = webinar.thumbnail || null;
      
      this.webinarForm.patchValue({
        title: webinar.title,
        description: webinar.description,
        topic: webinar.topic,
        host: webinar.host._id || this.adminId,
        date: this.formatDateForInput(new Date(webinar.date)),
        startTime: webinar.startTime,
        endTime: webinar.endTime,
        modeType: webinar.modeType,
        address: webinar.address,
        mapLink: webinar.mapLink,
        zoomLink: webinar.zoomLink,
        zoomMeetingId: webinar.zoomMeetingId,
        zoomPasscode: webinar.zoomPasscode,
        accessType: webinar.accessType,
        price: webinar.price,
        maxCapacity: webinar.maxCapacity,
        status: webinar.status,
      });
    } else {
      this.webinarForm.reset({
        host: this.adminId,
        modeType: 'online',
        accessType: 'free',
        price: 0,
        maxCapacity: 100,
        status: 'scheduled'
      });
    }
    this.cdr.detectChanges();
  }

  closeWebinarModal(): void {
    this.showWebinarModal = false;
    this.editMode = false;
    this.editingWebinarId = null;
    this.formSubmitted = false;
    this.selectedThumbnail = null;
    this.previewThumbnail = null;
    this.webinarForm.reset({
      host: this.adminId,
      modeType: 'online',
      accessType: 'free',
      price: 0,
      maxCapacity: 100,
      status: 'scheduled'
    });
    this.cdr.detectChanges();
  }

  async submitWebinar(): Promise<void> {
    this.formSubmitted = true;
    
    if (this.webinarForm.invalid) {
      this.webinarForm.markAllAsTouched();
      swalHelper.showToast('Please fill all required fields correctly', 'error');
      return;
    }

    this.modalLoading = true;
    try {
      const formValue = this.webinarForm.value;

      if (this.editMode && this.editingWebinarId) {
        const updateData: UpdateWebinarData = {
          webinarId: this.editingWebinarId,
          title: formValue.title,
          description: formValue.description,
          topic: formValue.topic,
          host: formValue.host,
          date: formValue.date,
          startTime: formValue.startTime,
          endTime: formValue.endTime,
          modeType: formValue.modeType,
          address: formValue.address,
          mapLink: formValue.mapLink,
          zoomLink: formValue.zoomLink,
          zoomMeetingId: formValue.zoomMeetingId,
          zoomPasscode: formValue.zoomPasscode,
          accessType: formValue.accessType,
          price: formValue.price,
          maxCapacity: formValue.maxCapacity,
          status: formValue.status,
        };
        
        const response = await this.webinarService.updateWebinar(updateData, this.selectedThumbnail || undefined);
        
        if (response.success) {
          swalHelper.showToast('Webinar updated successfully', 'success');
          this.closeWebinarModal();
          await this.fetchWebinars();
        } else {
          swalHelper.showToast(response.message || 'Failed to update webinar', 'error');
        }
      } else {
        const createData: CreateWebinarData = {
          title: formValue.title,
          description: formValue.description,
          topic: formValue.topic,
          host: formValue.host,
          date: formValue.date,
          startTime: formValue.startTime,
          endTime: formValue.endTime,
          modeType: formValue.modeType,
          address: formValue.address,
          mapLink: formValue.mapLink,
          zoomLink: formValue.zoomLink,
          zoomMeetingId: formValue.zoomMeetingId,
          zoomPasscode: formValue.zoomPasscode,
          accessType: formValue.accessType,
          price: formValue.price,
          maxCapacity: formValue.maxCapacity,
          status: formValue.status,
        };
        
        const response = await this.webinarService.createWebinar(createData, this.selectedThumbnail || undefined);
        
        if (response.success) {
          swalHelper.showToast('Webinar created successfully', 'success');
          this.closeWebinarModal();
          await this.fetchWebinars();
        } else {
          swalHelper.showToast(response.message || 'Failed to create webinar', 'error');
        }
      }
    } catch (error: any) {
      console.error('Error saving webinar:', error);
      const errorMessage = error?.error?.message || error?.message || 'Failed to save webinar';
      swalHelper.showToast(errorMessage, 'error');
    } finally {
      this.modalLoading = false;
      this.cdr.detectChanges();
    }
  }

  async deleteWebinar(webinarId: string): Promise<void> {
    const confirmed = await swalHelper.confirmation(
      'Are you sure?',
      'Do you want to delete this webinar? This action cannot be undone.',
      'warning'
    );

    if (!confirmed) return;

    this.loading = true;
    try {
      const response = await this.webinarService.deleteWebinar(webinarId);
      if (response.success) {
        swalHelper.showToast('Webinar deleted successfully', 'success');
        await this.fetchWebinars();
      } else {
        swalHelper.showToast(response.message || 'Failed to delete webinar', 'error');
      }
    } catch (error: any) {
      console.error('Error deleting webinar:', error);
      const errorMessage = error?.error?.message || error?.message || 'Failed to delete webinar';
      swalHelper.showToast(errorMessage, 'error');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // View Registered Users
  async viewRegisteredUsers(webinarId: string): Promise<void> {
    this.selectedWebinarId = webinarId;
    this.showRegistrationsModal = true;
    await this.fetchRegisteredUsers();
  }

  async fetchRegisteredUsers(): Promise<void> {
    if (!this.selectedWebinarId) return;

    this.modalLoading = true;
    try {
      const params: any = {
        webinarId: this.selectedWebinarId,
        page: this.registrationFilters.page,
        limit: this.registrationFilters.limit,
      };

      if (this.registrationFilters.approvalStatus) {
        params.approvalStatus = this.registrationFilters.approvalStatus;
      }

      const response = await this.webinarService.getRegisteredUsers(params);
      this.registrations = response;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error fetching registrations:', error);
      swalHelper.showToast('Failed to fetch registrations', 'error');
    } finally {
      this.modalLoading = false;
      this.cdr.detectChanges();
    }
  }

  closeRegistrationsModal(): void {
    this.showRegistrationsModal = false;
    this.selectedWebinarId = null;
    this.registrationFilters = {
      page: 1,
      limit: 10,
      approvalStatus: '',
    };
    this.registrations = {
      docs: [],
      totalDocs: 0,
      limit: 10,
      page: 1,
      totalPages: 0,
      pagingCounter: 0,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    };
    this.cdr.detectChanges();
  }

  async approveRegistration(registrationId: string, action: 'approve' | 'reject'): Promise<void> {
    try {
      const response = await this.webinarService.approveRegistration(registrationId, action, this.adminId);
      if (response.success) {
        swalHelper.showToast(`Registration ${action}d successfully`, 'success');
        await this.fetchRegisteredUsers();
      } else {
        swalHelper.showToast(response.message || `Failed to ${action} registration`, 'error');
      }
    } catch (error: any) {
      console.error(`Error ${action}ing registration:`, error);
      const errorMessage = error?.error?.message || error?.message || `Failed to ${action} registration`;
      swalHelper.showToast(errorMessage, 'error');
    }
  }

  // View Video Requests
  async viewVideoRequests(webinarId: string): Promise<void> {
    this.selectedWebinarId = webinarId;
    this.showVideoRequestsModal = true;
    await this.fetchVideoRequests();
  }

  async fetchVideoRequests(): Promise<void> {
    if (!this.selectedWebinarId) return;

    this.modalLoading = true;
    try {
      const params: any = {
        webinarId: this.selectedWebinarId,
      };

      if (this.videoRequestFilters.status) {
        params.status = this.videoRequestFilters.status;
      }

      const response = await this.webinarService.getVideoRequests(params);
      if (response.success && response.data) {
        this.videoRequests = response.data;
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error fetching video requests:', error);
      swalHelper.showToast('Failed to fetch video requests', 'error');
    } finally {
      this.modalLoading = false;
      this.cdr.detectChanges();
    }
  }

  closeVideoRequestsModal(): void {
    this.showVideoRequestsModal = false;
    this.selectedWebinarId = null;
    this.videoRequestFilters = {
      status: '',
    };
    this.videoRequests = {
      webinarId: '',
      webinarTitle: '',
      totalRequests: 0,
      videoRequests: []
    };
    this.cdr.detectChanges();
  }

  async approveVideoRequest(requestId: string, action: 'approve' | 'reject'): Promise<void> {
    if (!this.selectedWebinarId) return;

    try {
      const response = await this.webinarService.approveVideoRequest(
        this.selectedWebinarId,
        requestId,
        action,
        this.adminId
      );
      
      if (response.success) {
        swalHelper.showToast(`Video request ${action}d successfully`, 'success');
        await this.fetchVideoRequests();
      } else {
        swalHelper.showToast(response.message || `Failed to ${action} video request`, 'error');
      }
    } catch (error: any) {
      console.error(`Error ${action}ing video request:`, error);
      const errorMessage = error?.error?.message || error?.message || `Failed to ${action} video request`;
      swalHelper.showToast(errorMessage, 'error');
    }
  }

  // Upload Video URL
  openUploadVideoModal(webinarId: string): void {
    this.selectedWebinarId = webinarId;
    this.showUploadVideoModal = true;
    this.videoUrl = '';
  }

  closeUploadVideoModal(): void {
    this.showUploadVideoModal = false;
    this.selectedWebinarId = null;
    this.videoUrl = '';
  }

  async submitVideoUrl(): Promise<void> {
    if (!this.selectedWebinarId || !this.videoUrl) {
      swalHelper.showToast('Please enter a valid video URL', 'error');
      return;
    }

    this.modalLoading = true;
    try {
      const response = await this.webinarService.uploadWebinarVideo(this.selectedWebinarId, this.videoUrl);
      if (response.success) {
        swalHelper.showToast('Video URL uploaded successfully', 'success');
        this.closeUploadVideoModal();
        await this.fetchWebinars();
      } else {
        swalHelper.showToast(response.message || 'Failed to upload video URL', 'error');
      }
    } catch (error: any) {
      console.error('Error uploading video URL:', error);
      const errorMessage = error?.error?.message || error?.message || 'Failed to upload video URL';
      swalHelper.showToast(errorMessage, 'error');
    } finally {
      this.modalLoading = false;
      this.cdr.detectChanges();
    }
  }

  onFilterChange(): void {
    this.filters.page = 1;
    this.filterSubject.next();
  }

  onPageChange(page: number): void {
    this.filters.page = page;
    this.fetchWebinars();
  }

  onRegistrationFilterChange(): void {
    this.registrationFilters.page = 1;
    this.fetchRegisteredUsers();
  }

  onRegistrationPageChange(page: number): void {
    this.registrationFilters.page = page;
    this.fetchRegisteredUsers();
  }

  onVideoRequestFilterChange(): void {
    this.fetchVideoRequests();
  }

  resetFilters(): void {
    this.filters = {
      page: 1,
      limit: 10,
      status: '',
      accessType: '',
      modeType: '',
      search: '',
    };
    this.fetchWebinars();
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedThumbnail = input.files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewThumbnail = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.selectedThumbnail);
    }
  }

  removeThumbnail(): void {
    this.selectedThumbnail = null;
    this.previewThumbnail = null;
    // Reset file input
    const fileInput = document.getElementById('thumbnailInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.cdr.detectChanges();
  }
}